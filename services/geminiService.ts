import { GoogleGenAI, Modality, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { Task } from '../types';

// Helper to get a new client instance.
// Note: for Veo, a new instance should be created right before the call to ensure the latest API key is used.
const getAiClient = () => {
    if (!process.env.API_KEY) {
        // This will be caught by the API client itself, but good to have a warning.
        console.warn("API_KEY environment variable not set. Using a placeholder. Please set your API key.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
}


// Define strict safety settings to prevent harmful content generation
const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
];

// Helper to provide more specific error feedback to the user
const handleApiError = (error: any): string => {
    console.error("Gemini API Error:", error);

    // Handle network errors first
    if (!navigator.onLine) {
        return 'You are offline. Please check your internet connection.';
    }
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        return 'Network error: Could not connect to the AI service. Please check your internet connection and try again.';
    }

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Prioritize our specific, user-friendly error messages.
    if (error instanceof Error && (
        error.message.startsWith('Your request was blocked') ||
        error.message.startsWith('No image was returned') ||
        error.message.startsWith('The AI gave a text response') ||
        error.message.startsWith('The API returned an empty description') ||
        error.message.startsWith('Image generation returned no images') ||
        error.message.startsWith('The API could not enhance the prompt') ||
        error.message.includes('The API returned an empty response') ||
        error.message.startsWith('API key selection failed') ||
        error.message.startsWith('Could not identify the object')
    )) {
        return error.message;
    }

    if (errorMessage.includes('SAFETY')) {
        return 'Your request was blocked by the safety filter. Please modify your prompt or use a different image and try again.';
    }
    if (errorMessage.includes('API key not valid')) {
        return 'The provided API key is not valid. Please ensure it is configured correctly.';
    }
    if (errorMessage.includes('quota')) {
        return 'You have exceeded your API quota. Please check your account status or try again later.';
    }
     if (errorMessage.includes('resource has been exhausted')) {
        return 'The service is currently busy. Please try again in a few moments.';
    }
    if (errorMessage.includes('API_KEY')) { // Catch other potential key issues
        return 'There is an issue with your API key configuration. Please ensure it is correct and has the necessary permissions.';
    }
    
    return "An unexpected error occurred while communicating with the AI. Please check the console for more details.";
};


const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

export const processImage = async (task: Task, imageFile: File, prompt?: string, secondaryFile?: File): Promise<string> => {
    const ai = getAiClient();
    try {
        const imagePart = await fileToGenerativePart(imageFile);
        const parts: any[] = [imagePart];
        let text: string;

        if (task === Task.EDIT && prompt) {
            text = prompt;
        } else {
            switch (task) {
                case Task.UPSCALE:
                    text = 'Upscale this image, making it higher resolution. Sharpen details, reduce noise, and improve overall clarity without altering the subject or composition.';
                    break;
                case Task.REPAIR:
                    text = 'Repair this photograph. Restore faded colors, fix scratches, and mend any visible damage.';
                    break;
                case Task.WATERMARK:
                     if (secondaryFile) {
                        const maskPart = await fileToGenerativePart(secondaryFile);
                        parts.push(maskPart);
                        text = 'The user has provided an image and a mask. Remove the content from the original image where the mask is white. Fill in the removed areas seamlessly.';
                    } else {
                        // This case should ideally not be hit if the UI enforces a mask, but it's a safe fallback.
                        text = 'Remove the watermark from this image. The area where the watermark was should be seamlessly filled in to match the surrounding image.';
                    }
                    break;
                default:
                    throw new Error('Invalid or unsupported image processing task.');
            }
        }
        parts.push({ text });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: parts },
            config: {
                responseModalities: [Modality.IMAGE],
            },
            safetySettings,
        });

        const candidate = response.candidates?.[0];

        // A response might not contain any candidates if it's blocked.
        if (!candidate) {
            if (response.promptFeedback?.blockReason) {
                throw new Error(`Your request was blocked by the safety filter (${response.promptFeedback.blockReason}). Please modify your prompt or use a different image.`);
            }
            throw new Error('The API returned an empty response.');
        }

        // If a candidate exists, but finished for a safety reason, it won't have content.
        if (candidate.finishReason === 'SAFETY') {
            throw new Error(`Your request was blocked by the safety filter (SAFETY). Please modify your prompt or use a different image.`);
        }
        
        if (candidate.content?.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData) {
                    return part.inlineData.data;
                }
            }
            // If no image part was found, check for a text response from the model which might explain why.
            const textResponse = candidate.content.parts.map(p => p.text).filter(Boolean).join(' ');
            if (textResponse) {
                throw new Error(`The AI gave a text response instead of an image: "${textResponse}"`);
            }
        }

        // Fallback for cases where a candidate exists but contains no image data.
        throw new Error('No image was returned from the API.');
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const describeImage = async (imageFile: File): Promise<string> => {
    const ai = getAiClient();
    try {
        const imagePart = await fileToGenerativePart(imageFile);
        const textPart = { text: 'Describe this image in detail, including the style, subject, composition, colors, and any notable features.' };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            safetySettings,
        });
        
        const candidate = response.candidates?.[0];

        if (!candidate) {
             if (response.promptFeedback?.blockReason) {
                throw new Error(`Your request was blocked by the safety filter (${response.promptFeedback.blockReason}). Please use a different image.`);
            }
            throw new Error('The API returned an empty response.');
        }

        if (candidate.finishReason === 'SAFETY') {
            throw new Error(`Your request was blocked by the safety filter (SAFETY). Please use a different image.`);
        }

        const text = response.text;
        if (text) {
            return text;
        }

        throw new Error('The API returned an empty description. The image might be unrecognizable.');
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const generateImage = async (prompt: string): Promise<string> => {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '1:1',
            },
            safetySettings,
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages[0].image.imageBytes;
        }

        if (response.promptFeedback?.blockReason) {
            throw new Error(`Your request was blocked by the safety filter (${response.promptFeedback.blockReason}). Please modify your prompt.`);
        }

        throw new Error('Image generation returned no images.');
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const generateImageFromSketch = async (sketchFile: File): Promise<string> => {
    const ai = getAiClient();
    try {
        const sketchPart = await fileToGenerativePart(sketchFile);
        const textPart = { text: "You are an AI that interprets user sketches. Analyze this sketch, which may be in color. First, identify the primary object. Then, generate a high-quality, 3D animated style, rendered image of that object on a clean, neutral background, taking into account the colors used in the sketch as a style reference. The final image should look like a frame from an animation. If you cannot clearly identify a single object in the sketch, respond with only the text 'ERROR: Could not identify the object in the sketch.' and nothing else." };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [sketchPart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
            safetySettings,
        });

        const candidate = response.candidates?.[0];

        if (!candidate) {
            if (response.promptFeedback?.blockReason) {
                throw new Error(`Your request was blocked by the safety filter (${response.promptFeedback.blockReason}).`);
            }
            throw new Error('The API returned an empty response.');
        }

        if (candidate.finishReason === 'SAFETY') {
            throw new Error(`Your request was blocked by the safety filter (SAFETY).`);
        }
        
        if (candidate.content?.parts) {
             const textResponse = candidate.content.parts.map(p => p.text).filter(Boolean).join(' ');
            if (textResponse && textResponse.includes('ERROR:')) {
                throw new Error(textResponse.replace('ERROR: ', ''));
            }
            
            for (const part of candidate.content.parts) {
                if (part.inlineData) {
                    return part.inlineData.data;
                }
            }
        }
        
        throw new Error('No image was returned from the API.');
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};

export const enhancePrompt = async (prompt: string, task?: Task): Promise<string> => {
    const ai = getAiClient();
    if (!prompt.trim()) {
        return prompt;
    }
    try {
        let systemInstruction: string;

        if (task === Task.EDIT) {
            systemInstruction = "You are an AI assistant for refining image editing prompts. Rewrite the user's instructions to be clearer for the AI, focusing on style and specific changes. **Crucially, you must preserve the subject and composition of the original image.** Your goal is to enhance the user's *edit request*, not to invent a new scene. For example, if the user says 'make the sky a sunset', you could suggest 'transform the sky into a vibrant sunset with warm orange and purple hues'. Do not add new elements. Return only the enhanced prompt itself.";
        } else {
            systemInstruction = "You are a creative assistant who specializes in writing prompts for AI image generators. Based on the user's input, rewrite and expand the prompt to be more descriptive and detailed. Add concepts related to style (e.g., photorealistic, impressionistic, cinematic), composition, lighting, and mood to create a more visually compelling and artistic result. Return only the enhanced prompt itself, without any introductory text or explanation.";
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction,
            },
            safetySettings,
        });

        const candidate = response.candidates?.[0];
        
        if (!candidate) {
             if (response.promptFeedback?.blockReason) {
                throw new Error(`Your request was blocked by the safety filter (${response.promptFeedback.blockReason}). Please modify your prompt.`);
            }
            throw new Error('The API returned an empty response.');
        }

        if (candidate.finishReason === 'SAFETY') {
            throw new Error(`Your request was blocked by the safety filter (SAFETY). Please modify your prompt.`);
        }

        const text = response.text.trim();
        if (text) {
            return text;
        }
        
        throw new Error('The API could not enhance the prompt. Please try rephrasing it.');
    } catch (error) {
        throw new Error(handleApiError(error));
    }
};