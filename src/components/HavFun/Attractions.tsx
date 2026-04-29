import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const ATTRACTIONS = [
    {
        title: "Kids Zone",
        description: "A special area designed for the little ones, filled with soft play zones, mini slides, and interactive play structures for safe, endless fun.",
        image: "https://havfuntrampolinepark.com/wp-content/uploads/2024/10/DSC08420-min-1024x683.jpg"
    },
    {
        title: "Foam Pits",
        description: "Dive headfirst into a soft pit filled with foam cubes, perfect for practicing aerial tricks with a soft landing.",
        image: "https://havfuntrampolinepark.com/wp-content/uploads/2024/10/DSC08204-min-scaled.jpg"
    },
    {
        title: "Slam Dunk Zone",
        description: "Live out your basketball dreams by jumping higher than ever and slam dunking like a pro. Bring out the Kobe Bryant in you!",
        image: "https://havfuntrampolinepark.com/wp-content/uploads/2024/10/DSC08368-min-scaled.jpg"
    },
    {
        title: "Wipe Out",
        description: "Test your agility and strength on our challenging obstacle course that will bring out the strength in you.",
        image: "https://havfuntrampolinepark.com/wp-content/uploads/2024/10/DSC08218-min-scaled.jpg"
    },
    {
        title: "Main Court",
        description: "Bounce freely across interconnected trampolines and practice your flips in an open space. A fun filled Activity.",
        image: "https://havfuntrampolinepark.com/wp-content/uploads/2024/10/DSC08259-min-scaled.jpg"
    },
    {
        title: "Spider Wall",
        description: "Stick, climb, and bounce off our Spider Wall! Suit up in special Velcro suits and leap onto the wall, sticking like a superhero.",
        image: "https://havfuntrampolinepark.com/wp-content/uploads/2024/10/DSC08254-min-scaled.jpg"
    }
];

const Attractions = () => {
    return (
        <section id="attractions" className="py-28 bg-muted/30 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none opacity-40">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-20 space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
                    >
                        Explore the Fun
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-4xl md:text-6xl font-bold tracking-tight"
                    >
                        Jump, <span className="text-primary italic">Flip</span> & Play
                    </motion.h2>
                    <motion.div
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="h-1 w-24 bg-primary mx-auto rounded-full"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                    {ATTRACTIONS.map((attraction, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{
                                delay: idx * 0.1,
                                duration: 0.7,
                                ease: [0.215, 0.61, 0.355, 1]
                            }}
                            whileHover={{ y: -10 }}
                            className="group relative flex flex-col rounded-[2.5rem] bg-card/60 backdrop-blur-xl border border-white/5 hover:border-primary/30 transition-all duration-500 shadow-xl overflow-hidden"
                        >
                            <div className="aspect-[4/3] overflow-hidden relative">
                                <img
                                    src={attraction.image}
                                    alt={attraction.title}
                                    className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110 brightness-90 group-hover:brightness-100"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    whileHover={{ opacity: 1 }}
                                    className="absolute inset-0 bg-primary/10 backdrop-blur-[2px] opacity-0 transition-opacity flex items-center justify-center"
                                >
                                    <span className="text-white font-bold tracking-widest text-xs border border-white/40 px-6 py-2 rounded-full uppercase">Details</span>
                                </motion.div>
                            </div>
                            <div className="p-8 flex-grow">
                                <motion.div
                                    className="w-10 h-1 bg-primary/30 mb-6 group-hover:w-20 transition-all duration-500"
                                />
                                <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors duration-300 tracking-tight">
                                    {attraction.title}
                                </h3>
                                <p className="text-muted-foreground text-base leading-relaxed mb-6 font-light">
                                    {attraction.description}
                                </p>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => window.location.href = '/booking'}
                                    className="text-xs font-black uppercase tracking-[0.2em] text-primary hover:text-white transition-colors flex items-center gap-2 group/btn"
                                >
                                    BOOK FOR {attraction.title}
                                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform" />
                                </motion.button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Attractions;
