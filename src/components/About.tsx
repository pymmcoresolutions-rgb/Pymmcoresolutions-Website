import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';
import { Target, Eye, Award, History, Rocket, Shield, Cpu, User } from 'lucide-react';

export default function About() {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data());
      }
    });
    return () => unsubscribe();
  }, []);

  const expertise = [
    {
      icon: Rocket,
      title: "App Development",
      description: "Specializing in high-performance applications for Mobile (iOS/Android), Web, and Desktop environments.",
      color: "text-blue-400",
      bg: "bg-blue-400/10"
    },
    {
      icon: Eye,
      title: "User-Focused Design",
      description: "Creating intuitive, conversion-focused interfaces that prioritize the user experience and brand identity.",
      color: "text-purple-400",
      bg: "bg-purple-400/10"
    },
    {
      icon: Shield,
      title: "Marketplace Hosting",
      description: "Providing a secure, curated platform for developers to showcase and promote their finished products.",
      color: "text-pink-400",
      bg: "bg-pink-400/10"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-24">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-24"
      >
        <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter mb-6">
          About <span className="text-blue-500">Pymmcore Solutions</span>
        </h1>
        <p className="text-xl text-white/40 max-w-2xl mx-auto leading-relaxed">
          Pioneering the future of application discovery and deployment through a curated, high-performance marketplace.
        </p>
      </motion.div>

      {/* Mission & Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-32">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-12 rounded-[3rem] bg-white/5 border border-white/10 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Target className="w-32 h-32" />
          </div>
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Target className="w-8 h-8 text-blue-500" /> Our Mission
          </h2>
          <p className="text-lg text-white/60 leading-relaxed">
            {settings?.aboutMission || "Our mission is to deliver ready-to-use, premium applications across mobile, web, and desktop platforms. We bridge the gap between complex infrastructure and end-user utility, ensuring that every piece of software we host is polished, secure, and ready for immediate impact."}
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-12 rounded-[3rem] bg-white/5 border border-white/10 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Eye className="w-32 h-32" />
          </div>
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Eye className="w-8 h-8 text-purple-500" /> Our Vision
          </h2>
          <p className="text-lg text-white/60 leading-relaxed">
            {settings?.aboutVision || "We envision becoming the world's most trusted marketplace for innovative applications. By fostering a community of elite developers and providing a streamlined discovery experience, we aim to set the global standard for how software is listed, promoted, and consumed."}
          </p>
        </motion.div>
      </div>

      {/* Expertise */}
      <div className="mb-32">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tighter mb-4">Our Expertise</h2>
          <p className="text-white/40">Specialized knowledge driving the next generation of software delivery.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {expertise.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all group"
            >
              <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <item.icon className={`w-7 h-7 ${item.color}`} />
              </div>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Founder's Bio */}
      <div className="mb-32">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <div className="relative aspect-square rounded-[4rem] bg-gradient-to-br from-blue-600 to-purple-600 p-1 overflow-hidden shadow-2xl shadow-blue-600/20">
              <div className="w-full h-full bg-black rounded-[3.8rem] flex items-center justify-center relative overflow-hidden group">
                  {settings?.founderPhotoUrl ? (
                    <img src={settings.founderPhotoUrl} alt={settings.founderName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="w-32 h-32 text-white/10 group-hover:scale-110 transition-transform duration-500" />
                  )}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                    <div className="text-2xl font-bold mb-1">{settings?.founderName || "Amos Adewale Adedayo"}</div>
                    <div className="text-sm text-blue-400 font-bold uppercase tracking-widest">{settings?.founderTitle || "Founder & Visionary"}</div>
                </div>
              </div>
            </div>
          </motion.div>

            <div className="lg:col-span-3 space-y-6">
              <h2 className="text-4xl font-bold tracking-tighter mb-8">The Heart Behind <span className="text-blue-500">Innovation</span></h2>
              <div className="space-y-6 text-lg text-white/60 leading-relaxed">
                {settings?.founderBio ? (
                  <div className="whitespace-pre-wrap">{settings.founderBio}</div>
                ) : (
                  <>
                    <p>
                      Amos Adewale Adedayo is a Nigerian-born tech enthusiast and innovator with a unique background in law enforcement. 
                      His journey reflects a blend of discipline, resilience, and forward-thinking creativity. Drawing from his years of 
                      service in law enforcement, Amos developed a strong sense of problem-solving and leadership, which he now channels 
                      into the world of technology and innovation.
                    </p>
                    <p>
                      Passionate about leveraging technology to improve lives and communities, Amos has dedicated himself to exploring 
                      new ideas, building solutions, and inspiring others to embrace innovation. His vision is rooted in the belief 
                      that technology can be a powerful tool for transformation, especially in emerging markets like Nigeria, where 
                      creativity and resourcefulness drive progress.
                    </p>
                    <p>
                      Beyond his professional pursuits, Amos is committed to mentoring and empowering young innovators, encouraging 
                      them to merge discipline with imagination to create meaningful impact. His story is one of determination, 
                      adaptability, and a relentless drive to push boundaries.
                    </p>
                  </>
                )}
              </div>
            </div>
        </div>
      </div>

      {/* Background/History */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-12 rounded-[3rem] bg-gradient-to-br from-blue-600/20 to-purple-600/10 border border-white/10"
      >
        <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-600/40">
          <Award className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-8 text-center">Our Background</h2>
            <div className="space-y-6 text-lg text-white/60 max-w-4xl mx-auto leading-relaxed">
              {settings?.aboutBackground ? (
                <div className="whitespace-pre-wrap">{settings.aboutBackground}</div>
              ) : (
                <>
                  <p>
                    We are a forward-thinking technology company committed to solving everyday challenges through innovation and intelligent design. 
                    Our platform delivers top-notch technical solutions that cut across industries, empowering individuals, organizations, 
                    and communities to work smarter, faster, and more effectively.
                  </p>
                  <p>
                    For law enforcement agencies, we provide specialized tools that address critical bottlenecks — from forensic analysis 
                    and data-driven insights to account monitoring, surveillance systems, and civic call applications that strengthen public engagement.
                  </p>
                  <p>
                    But our vision extends beyond law enforcement. We build solutions for everyone, offering versatile technologies 
                    that enhance productivity, streamline workflows, and unlock new possibilities across diverse fields.
                  </p>
                  <p>
                    At the core of our innovation is <span className="text-blue-400 font-bold">MAAY (My Algorithmic Assistant You)</span> — an advanced AI assistant designed to support 
                    both professionals and everyday users. MAAY combines intelligence, adaptability, and a rich suite of features to 
                    simplify tasks, provide actionable insights, and deliver exceptional value in real time.
                  </p>
                  <p className="text-center font-medium text-white/80 pt-4">
                    Driven by creativity and excellence, we are shaping a future where technology empowers people everywhere to achieve more.
                  </p>
                </>
              )}
            </div>
      </motion.div>
    </div>
  );
}
