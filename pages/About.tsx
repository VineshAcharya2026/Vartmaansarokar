
import React from 'react';
import { BookOpen, Target, Globe, Users, Award, ShieldCheck } from 'lucide-react';

const About: React.FC = () => {
  const team = [
    { name: "Chhaya Rani", role: "Publisher", initial: "CR" },
    { name: "Rahul ‘Neil’", role: "Editor", initial: "RN" },
    { name: "Sarthak Pandey", role: "Head of Digital Strategy", initial: "SP" },
    { name: "Tarun Munjal", role: "Head of Administration & Strategic Affairs", initial: "TM" }
  ];

  return (
    <div className="space-y-20 pb-20 animate-in fade-in duration-700">
      {/* Hero Section - Realigned to Logo Identity */}
      <section className="text-center space-y-4 pt-10">
        <div className="flex flex-col items-center justify-center mb-6">
           {/* Visual representation of the logo's pyramid/pen nib */}
           <div className="w-20 h-20 bg-[#000080] rounded-2xl flex items-center justify-center text-white font-black text-4xl shadow-2xl mb-6 transform -rotate-3">
              VS
           </div>
           <h1 className="text-5xl md:text-7xl font-black text-[#000080] leading-none">वर्तमान</h1>
           <h1 className="text-5xl md:text-7xl font-black text-[#800000] leading-none mt-2">सरोकार</h1>
        </div>
        <p className="text-xl md:text-3xl text-[#800000] font-bold serif italic mt-8">
          अतीत से सीख कर उज्जवल भविष्य की ओर
        </p>
        <div className="w-24 h-1.5 bg-[#800000] mx-auto rounded-full mt-10" />
      </section>

      {/* Who We Are */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-[#001f3f] serif flex items-center">
            <span className="w-1.5 h-8 bg-[#800000] mr-4 rounded-full" />
            Who We Are
          </h2>
          <div className="text-gray-600 leading-relaxed space-y-4 text-lg">
            <p>
              <strong>वर्तमान सरोकार (Vartmaan Sarokaar)</strong> is a monthly magazine published by <strong>Vaanee Creations Pvt. Ltd.</strong> with a vision to inform, inspire, and influence. The magazine is dedicated to presenting sharp insights on current affairs and thought-provoking stories that go beyond the headlines.
            </p>
            <p>
              At the heart of our work lies a special focus on empowering the youth of India. We bring them stories that matter—covering politics, economy, society, culture, innovation, leadership, and more. 
            </p>
            <p>
              Each issue is carefully curated to not only highlight the pressing issues of our times but also to spark ideas and meaningful conversations that shape the future of our nation.
            </p>
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-[#800000]/5 -rotate-3 rounded-3xl" />
          <img 
            src="https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1000" 
            alt="Journalism" 
            className="rounded-3xl shadow-2xl relative z-10 w-full h-[400px] object-cover"
          />
        </div>
      </section>

      {/* Vision Section */}
      <section className="bg-[#001f3f] text-white rounded-[40px] p-10 md:p-20 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#800000]/20 rounded-full blur-[100px] -mr-48 -mt-48" />
        <div className="relative z-10 text-center max-w-4xl mx-auto space-y-8">
          <Target className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-4xl md:text-5xl font-bold serif">Our Vision</h2>
          <p className="text-xl md:text-2xl text-gray-300 leading-relaxed font-light">
            "Vartmaan Sarokaar is more than just a magazine—it is a platform for dialogue and discovery, where voices are heard, perspectives are shared, and new possibilities are imagined."
          </p>
          <div className="w-20 h-1 bg-red-400/30 mx-auto" />
          <p className="text-gray-400 text-lg italic">
            अतीत से सीख कर उज्जवल भविष्य की ओर - By blending knowledge with inspiration, we aim to encourage the young generation to remain aware, responsible, and motivated to build a better tomorrow.
          </p>
        </div>
      </section>

      {/* What We Cover */}
      <section className="space-y-12">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#001f3f] serif">What We Cover</h2>
          <p className="text-gray-500 mt-4">Exploring the dimensions of progress and heritage.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Politics & Economy",
              desc: "In-depth analysis of political landscapes and economic trends shaping our nation.",
              icon: Globe,
              color: "bg-blue-50 text-blue-600"
            },
            {
              title: "Society & Culture",
              desc: "Stories that reflect the diverse tapestry of Indian society and its rich cultural heritage.",
              icon: Users,
              color: "bg-red-50 text-red-600"
            },
            {
              title: "Innovation & Leadership",
              desc: "Inspiring narratives of innovation and leaders who are making a difference.",
              icon: Award,
              color: "bg-amber-50 text-amber-600"
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
              <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <item.icon size={28} />
              </div>
              <h3 className="text-xl font-bold text-[#001f3f] mb-4 serif">{item.title}</h3>
              <p className="text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Our Team */}
      <section className="space-y-12">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#001f3f] serif">Our Team</h2>
          <p className="text-gray-500 mt-4">The passionate people behind Vartmaan Sarokaar</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, idx) => (
            <div key={idx} className="bg-white p-8 rounded-3xl border border-gray-100 text-center shadow-sm hover:shadow-md transition-all">
              <div className="w-20 h-20 bg-gradient-to-br from-[#800000] to-[#000080] rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg">
                {member.initial}
              </div>
              <h4 className="text-xl font-bold text-[#001f3f] serif">{member.name}</h4>
              <p className="text-sm text-[#800000] font-bold mt-2 uppercase tracking-widest">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Badge */}
      <section className="bg-gray-50 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 border border-dashed border-gray-200">
        <div className="flex items-center space-x-6">
          <ShieldCheck className="w-12 h-12 text-[#800000]" />
          <div>
            <h4 className="text-xl font-bold text-[#001f3f] serif">Vaanee Creations Pvt. Ltd.</h4>
            <p className="text-gray-500 text-sm">Commitment to authentic storytelling and responsible journalism since our inception.</p>
          </div>
        </div>
        <button className="bg-[#000080] text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-950 transition-colors shrink-0 shadow-lg">
          Join Our Platform
        </button>
      </section>
    </div>
  );
};

export default About;
