/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Film, Sparkles, HelpCircle, AlertTriangle, Layers, MessageSquare, Smile, RefreshCw } from 'lucide-react';
import { ConfigState } from '../types.js';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  config: ConfigState;
  checkConfig: () => void;
}

export default function Header({ activeTab, setActiveTab, config, checkConfig }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-[#141414]/90 backdrop-blur-md border-b border-white/5 transition-all duration-300">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('recommend')}>
            <div className="bg-red-600 p-2 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20">
              <Film className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <span className="font-sans font-black tracking-wider text-xl bg-gradient-to-r from-white via-red-500 to-red-600 bg-clip-text text-transparent">
                MOVIEMIND
              </span>
              <span className="font-mono text-[9px] block text-gray-500 tracking-widest leading-none mt-0.5">
                AI PRO PIPELINE
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex space-x-1" id="main-navigation">
            <button
              id="nav-recommend"
              onClick={() => setActiveTab('recommend')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                activeTab === 'recommend'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              ML Recommendations
            </button>

            <button
              id="nav-mood"
              onClick={() => setActiveTab('mood')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                activeTab === 'mood'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Smile className="h-4 w-4" />
              Mood Match
            </button>

            <button
              id="nav-compare"
              onClick={() => setActiveTab('compare')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                activeTab === 'compare'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="h-4 w-4" />
              Movie Comparison
            </button>

            <button
              id="nav-assistant"
              onClick={() => setActiveTab('assistant')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                activeTab === 'assistant'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              AI Cinema Guide
            </button>
          </nav>

          {/* Status Indicator / Badges */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium bg-green-500/10 text-green-400 border border-green-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-ping" />
              LIVE TF-IDF
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
              LLAMA-3.3
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
