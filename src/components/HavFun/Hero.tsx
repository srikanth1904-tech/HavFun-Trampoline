import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import PremiumButton from '@/components/ui/PremiumButton';

const Hero = () => {
    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background Image from HavFun */}
            <div
                className="absolute inset-0 bg-cover bg-center z-0 scale-105 animate-slow-zoom"
                style={{
                    backgroundImage: 'url("https://havfuntrampolinepark.com/wp-content/uploads/2024/10/DSC08279-min-scaled.jpg")',
                }}
            ></div>
            <div className="absolute inset-0 bg-black/60 z-10" />

            <div className="relative z-20 container mx-auto px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <img
                        src="https://havfuntrampolinepark.com/wp-content/uploads/2024/10/IMG_7567-e1739166515549.png"
                        alt="HavFun Logo"
                        className="h-32 md:h-48 mx-auto mb-8 drop-shadow-neon"
                    />

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
                        Where Thrills, Laughter, <br /> and Memories <span className="text-primary italic">Take Flight</span>.
                    </h1>

                    <p className="text-lg md:text-xl text-gray-200 mb-6 max-w-2xl mx-auto leading-relaxed">
                        Welcome to HavFun Trampoline, the ultimate destination for high-flying fun and unforgettable experiences.
                    </p>


                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link to="/booking">
                            <PremiumButton className="h-14 px-8 text-lg">
                                Book Now <ArrowRight className="ml-2 w-5 h-5" />
                            </PremiumButton>
                        </Link>
                        <a href="#attractions" className="px-8 py-4 rounded-xl glass-premium text-white font-medium hover:bg-white/10 transition-colors">
                            View Attractions
                        </a>
                    </div>
                </motion.div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-background to-transparent z-20"></div>
        </div>
    );
};

export default Hero;
