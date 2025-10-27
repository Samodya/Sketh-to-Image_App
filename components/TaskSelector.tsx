import React from 'react';
import { Task } from '../types';
import { ImageIcon, PencilIcon, SearchIcon, XIcon, BrushIcon } from './icons';

interface TaskSelectorProps {
  selectedTask: Task;
  onSelectTask: (task: Task) => void;
  isOpen: boolean;
  onClose: () => void;
}

const tasks = [
  { id: Task.GENERATE, icon: <ImageIcon className="w-5 h-5" />, label: "Generate" },
  { id: Task.SKETCH_TO_IMAGE, icon: <BrushIcon className="w-5 h-5" />, label: "Sketch to Image" },
  { id: Task.EDIT, icon: <PencilIcon className="w-5 h-5" />, label: "Edit" },
  { id: Task.DESCRIBE, icon: <SearchIcon className="w-5 h-5" />, label: "Describe" },
];

export const TaskSelector: React.FC<TaskSelectorProps> = ({ selectedTask, onSelectTask, isOpen, onClose }) => {
  
  const handleSelect = (task: Task) => {
    onSelectTask(task);
    onClose(); // Auto-close on mobile after selection
  }
  
  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-gray-900 border-r border-gray-700/50 transition-transform duration-300 ease-in-out lg:static lg:w-64 lg:translate-x-0 lg:flex-shrink-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between p-4 h-[73px] border-b border-gray-700/50">
        <h2 className="text-lg font-semibold text-gray-100">Tasks</h2>
        <button 
          onClick={onClose} 
          className="p-2 -mr-2 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 lg:hidden" 
          aria-label="Close task selector"
        >
          <XIcon className="w-6 h-6" />
        </button>
      </div>
      <nav className="p-4">
        <ul className="space-y-1">
          {tasks.map((task) => (
            <li key={task.id}>
              <button
                onClick={() => handleSelect(task.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:ring-indigo-500
                  ${selectedTask === task.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-300 hover:bg-gray-800/60'
                  }`}
              >
                {React.cloneElement(task.icon, { className: 'w-6 h-6' })}
                <span>{task.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};