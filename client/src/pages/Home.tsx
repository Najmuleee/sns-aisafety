import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { Shield, Lock, Users, Zap, Image, CheckCircle2, ArrowRight, Github } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      window.location.href = getLoginUrl("/dashboard");
    }
  };

  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Privacy-First Design",
      description: "Your photos stay under your control with consent-based visibility management"
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: "AI Face Recognition",
      description: "Advanced face detection and matching using state-of-the-art embeddings"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Multi-Party Consent",
      description: "All people in photos approve before they're shared publicly"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Instant Processing",
      description: "Real-time face detection and consent orchestration"
    },
    {
      icon: <Image className="w-8 h-8" />,
      title: "Smart Rendering",
      description: "Automatic blur on faces without consent, visible when approved"
    },
    {
      icon: <CheckCircle2 className="w-8 h-8" />,
      title: "Complete Audit Trail",
      description: "Full transparency with detailed logs of all actions and decisions"
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Register Your Face",
      description: "Upload 5-10 photos of yourself to create your face profile"
    },
    {
      number: "2",
      title: "Upload Group Photos",
      description: "Share group images with automatic face detection"
    },
    {
      number: "3",
      title: "Manage Consent",
      description: "Approve or reject visibility of your face in each photo"
    },
    {
      number: "4",
      title: "Share Safely",
      description: "Download and share photos with everyone's consent respected"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              PFIP
            </span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                  Dashboard
                </Button>
                <Button variant="ghost" onClick={() => navigate("/profile")}>
                  Profile
                </Button>
              </>
            ) : (
              <Button onClick={handleGetStarted} className="bg-blue-600 hover:bg-blue-700">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              Privacy-First
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Image Sharing
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Share group photos with confidence. Everyone's consent, everyone's privacy, everyone's control.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-lg px-8 py-6 rounded-lg"
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-slate-600 hover:bg-slate-800 text-lg px-8 py-6 rounded-lg"
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            >
              Learn More
            </Button>
          </div>

          <div className="pt-8 text-sm text-slate-400">
            <p>✓ No credit card required • ✓ Free tier available • ✓ Enterprise ready</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">Powerful Features</h2>
          <p className="text-xl text-slate-300">Everything you need for safe, consensual photo sharing</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all hover:shadow-lg hover:shadow-blue-500/10">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 text-blue-400">
                  {feature.icon}
                </div>
                <CardTitle className="text-white">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-slate-300">Simple 4-step process for consent-based sharing</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, idx) => (
            <div key={idx} className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-slate-300">{step.description}</p>
              </div>
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 -right-4 w-8 h-0.5 bg-gradient-to-r from-blue-500 to-transparent" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-slate-800/50 border-slate-700 text-center">
            <CardHeader>
              <CardTitle className="text-4xl font-bold text-blue-400">100%</CardTitle>
              <CardDescription className="text-slate-300">Consent-Based</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">Every face requires explicit approval before sharing</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 text-center">
            <CardHeader>
              <CardTitle className="text-4xl font-bold text-cyan-400">Real-Time</CardTitle>
              <CardDescription className="text-slate-300">Face Detection</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">Instant processing with advanced AI algorithms</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 text-center">
            <CardHeader>
              <CardTitle className="text-4xl font-bold text-blue-400">Full</CardTitle>
              <CardDescription className="text-slate-300">Audit Trail</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">Complete transparency with detailed logging</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-2xl p-12 text-center space-y-8">
          <div>
            <h2 className="text-4xl font-bold mb-4">Ready to Share Safely?</h2>
            <p className="text-xl text-slate-300">Join thousands of users who trust PFIP with their photos</p>
          </div>
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-lg px-8 py-6 rounded-lg"
          >
            Start Free Today
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Cookies</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition flex items-center gap-2"><Github className="w-4 h-4" /> GitHub</a></li>
                <li><a href="#" className="hover:text-white transition">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition">LinkedIn</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-8 flex items-center justify-between">
            <p className="text-slate-400">© 2026 PFIP. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <span className="text-slate-400">Privacy-First Image Publishing</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
