// components/home/what-is-redfinger.tsx
import { Gamepad2, Users, Smartphone, Zap, Cpu, TestTube } from "lucide-react";
import { Check } from "lucide-react";

const features = [
  {
    title: "Cloud Gaming",
    description: "Play mobile games 24/7 on cloud servers",
  },
  {
    title: "Multi-Account",
    description: "Manage multiple game accounts simultaneously",
  },
  {
    title: "No Hardware Limit",
    description: "Works on any device, even low-spec phones",
  },
];

const useCases = [
  {
    icon: Gamepad2,
    title: "Gaming",
    description: "AFK farming",
    color: "#b084cc",
  },
  {
    icon: Users,
    title: "Multi-Account",
    description: "Manage accounts",
    color: "#52a8ff",
  },
  {
    icon: Cpu,
    title: "Automation",
    description: "Bot scripts",
    color: "#52d652",
  },
  {
    icon: TestTube,
    title: "App Testing",
    description: "Development",
    color: "#ff9d4f",
  },
];

export function WhatIsRedfinger() {
  return (
    <section className="py-20 px-8">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20 justify-center">
          <div className=" flex justify-center mb-6 relative">
            <div className=" h-36 bg-linear-to-b from-[#C212A1]/10 to-[#C212A1] w-px absolute bottom-0 z-0"></div>
            <span className="px-3.5 py-1.5 bg-linear-to-r to-[#F40383] from-[#9021BF]  rounded-full left-5 text-background z-10 font-bold">
              2
            </span>
          </div>
          <div className="inline-flex items-center gap-2 mb-6 ">
            <span className="text-2xl font-semibold ">About Redfinger</span>
          </div>
          <h2
            className="text-3xl lg:text-4xl font-bold tracking-tight text-center mb-4"
            style={{ color: "#ededed" }}
          >
            What is Redfinger?
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Description */}
          <div>
            {/* Description */}
            <p className="text-base text-secondary mb-8 leading-relaxed">
              Redfinger is a cloud-based Android emulator that runs 24/7 in the
              cloud. Perfect for mobile gaming, app testing, and automation
              without draining your device battery or storage.
            </p>

            {/* Features List */}
            <div className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#52d652] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-primary">
                      {feature.title}:{" "}
                      <span className="font-normal text-secondary">
                        {feature.description}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Use Cases Grid */}
          <div>
            {/* Header */}

            {/* Grid */}
            <div className="grid grid-cols-2 gap-4">
              {useCases.map((useCase, index) => {
                const Icon = useCase.icon;
                return (
                  <div
                    key={index}
                    className="border border-white/10 rounded-lg p-6 hover:border-white/20 transition group"
                  >
                    {/* Icon */}
                    <div className="mb-4">
                      <Icon
                        className="w-10 h-10"
                        style={{ color: useCase.color }}
                      />
                    </div>

                    {/* Content */}
                    <h4 className="text-lg font-semibold text-primary mb-1">
                      {useCase.title}
                    </h4>
                    <p className="text-sm text-secondary">
                      {useCase.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
