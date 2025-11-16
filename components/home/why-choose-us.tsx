// components/home/why-choose-us.tsx
import {
  Zap,
  Lock,
  Headphones,
  Smartphone,
  Cloud,
  CheckCircle,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant Delivery",
    description:
      "Receive your redeem codes immediately after payment completion",
    color: "text-purple-400",
    bgColor: "bg-purple-950/40",
  },
  {
    icon: Lock,
    title: "Secure Payment",
    description: "Safe and secure transaction processing",
    color: "text-green-400",
    bgColor: "bg-green-950/40",
  },
  {
    icon: Headphones,
    title: "24/7 Access",
    description: "View your purchase history and codes anytime",
    color: "text-blue-400",
    bgColor: "bg-blue-950/40",
  },
];

export function WhyChooseUs() {
  return (
    <section className="py-20 px-8 mb-12" id="why-choose-us">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 justify-center">
          <div className=" flex justify-center mb-6 relative">
            <div className=" h-36 bg-linear-to-b from-[#22D960]/10 to-[#22D960] w-px absolute bottom-0 z-0"></div>
            <span className="px-3.5 py-1.5 bg-linear-to-r to-[#45B24D] from-[#00FF73]  rounded-full left-5 text-background z-10 font-bold">
              1
            </span>
          </div>
          <div className="inline-flex items-center gap-2 mb-6 ">
            <span className="text-2xl font-semibold text-linear-to-r to-[#45B24D] from-[#00FF73]">
              Why Choose Us
            </span>
          </div>
          <h2
            className="text-3xl lg:text-4xl font-bold tracking-tight text-center mb-4"
            style={{ color: "#ededed" }}
          >
            Best Redfinger Service
          </h2>
          <p className="text-lg text-center" style={{ color: "#a1a1a1" }}>
            Get the best cloud phone experience with instant delivery
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="border bg-stone-900/30 rounded-lg p-6 hover:border-white/20 transition group cursor-pointer"
                style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
              >
                {/* Icon Container */}
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition"
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                >
                  <Icon className={`${feature.color} w-6 h-6`} />
                </div>

                {/* Content */}
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ color: "#ededed" }}
                >
                  {feature.title}
                </h3>
                <p className="text-sm" style={{ color: "#a1a1a1" }}>
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
