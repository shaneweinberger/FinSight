import React, { useState } from 'react';
import { PieChart, TrendingUp, Shield, ChevronRight, ArrowRight, Lock } from 'lucide-react';

const LandingPage = () => {
    const [showModal, setShowModal] = useState(false);

    const handleSignIn = () => {
        setShowModal(true);
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white selection:bg-blue-500 selection:text-white overflow-hidden font-sans">
            {/* Background Elements */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10">
                {/* Navbar */}
                <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
                            <PieChart size={24} className="text-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            FinSight
                        </span>
                    </div>
                    <button
                        onClick={handleSignIn}
                        className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-medium transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 active:scale-95"
                    >
                        Sign In
                    </button>
                </nav>

                {/* Hero Section */}
                <main className="container mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm mb-8 animate-fade-in-up">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        <span className="text-sm text-slate-400">Financial Intelligence Reimagined</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-500 max-w-4xl leading-[1.1]">
                        Master Your Money with <br />
                        <span className="text-blue-500">AI-Powered</span> Insights
                    </h1>

                    <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl leading-relaxed">
                        Stop guessing where your money goes. FinSight uses advanced algorithms to categorize, analyze, and visualize your financial life in real-time.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <button
                            onClick={handleSignIn}
                            className="group px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-95"
                        >
                            Get Started
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={handleSignIn}
                            className="px-8 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium border border-slate-700 transition-all duration-300 active:scale-95"
                        >
                            View Demo
                        </button>
                    </div>

                    {/* Feature Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 w-full max-w-6xl">
                        {[
                            {
                                icon: <TrendingUp className="text-blue-400" size={32} />,
                                title: "Smart Analytics",
                                desc: "Visualize spending patterns with beautiful, interactive charts that tell the story behind the numbers."
                            },
                            {
                                icon: <Lock className="text-purple-400" size={32} />,
                                title: "Bank-Grade Security",
                                desc: "Your financial data is encrypted and secure. We prioritize your privacy above everything else."
                            },
                            {
                                icon: <Shield className="text-emerald-400" size={32} />,
                                title: "AI Categorization",
                                desc: "Automatically sort transactions into categories. No more manual spreadsheets or tagging."
                            }
                        ].map((feature, idx) => (
                            <div key={idx} className="group p-8 rounded-2xl bg-slate-800/30 border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/50 transition-all duration-300 text-left">
                                <div className="mb-6 p-4 rounded-xl bg-slate-900/50 w-fit group-hover:scale-110 transition-transform duration-300">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-slate-100">{feature.title}</h3>
                                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </main>

                <footer className="border-t border-slate-800 mt-20 py-12 bg-slate-900/50 backdrop-blur-lg">
                    <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-slate-500 text-sm">© 2026 FinSight. All rights reserved.</p>
                        <div className="flex gap-6 text-slate-500 text-sm">
                            <a href="#" className="hover:text-white transition-colors">Privacy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms</a>
                            <a href="#" className="hover:text-white transition-colors">Contact</a>
                        </div>
                    </div>
                </footer>
            </div>

            {/* Development Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowModal(false)} />
                    <div className="relative bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-md w-full animate-bounce-in">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-6 mx-auto">
                            <Lock className="text-blue-400" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-center mb-3 text-white">Access Restricted</h2>
                        <p className="text-slate-400 text-center mb-8 leading-relaxed">
                            FinSight is currently under active development. Access is limited to the development team only at this time.
                        </p>
                        <button
                            onClick={() => setShowModal(false)}
                            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-200"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LandingPage;
