// Mocks a simple Google Authentication service using localStorage.

export interface User {
  name: string;
  email: string;
  picture: string;
  apiCount: number;
}

const USER_STORAGE_KEY = 'google_user_session';

// A mock user profile picture.
const MOCK_USER_AVATAR = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ZmZiIgd2lkdGg9IjQ4cHgiIGhlaWdodD0iNDhweCI+PHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0wIDNjMS42NiAwIDMgMS4zNCAzIDNzLTEuMzQgMy0zIDMtMy0xLjM0LTMtM1MTAuMzQgNSAxMiA1em0wIDE0LjJjLTIuNSAwLTQuNzEtMS4yOC02LTMuMjIuMDMtMS45OSA0LTMuMDggNi0zLjA4czUuOTcgMS4wOSA2IDMuMDhjLTEuMjkgMS45NC0zLjUgMy4yMi02IDMuMjJ6Ii8+PC9zdmc+`;

export const authService = {
  signIn: (): User => {
    const user: User = {
      name: 'Demo User',
      email: 'demo@example.com',
      picture: MOCK_USER_AVATAR,
      apiCount: 0,
    };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    return user;
  },

  signOut: (): void => {
    localStorage.removeItem(USER_STORAGE_KEY);
  },

  getCurrentUser: (): User | null => {
    const userJson = localStorage.getItem(USER_STORAGE_KEY);
    if (!userJson) {
      return null;
    }
    try {
      return JSON.parse(userJson) as User;
    } catch (error) {
      console.error("Failed to parse user data from localStorage", error);
      return null;
    }
  },

  incrementApiCount: (): User | null => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, apiCount: currentUser.apiCount + 1 };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      return updatedUser;
    }
    return null;
  },
};
