import { useGsapPage } from "@/hooks/useGsapPage";
import { QrCode, ArrowLeft, Image as ImageIcon, Flashlight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function ScanPay() {
  useGsapPage();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col fixed inset-0 z-50">
      <div className="p-6 flex items-center justify-between z-10" data-anim>
        <Link to="/bills" className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors backdrop-blur-md">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex gap-3">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 hover:text-white backdrop-blur-md">
            <Flashlight className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 hover:text-white backdrop-blur-md">
            <ImageIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6" data-anim>
        <div className="relative w-64 h-64 mb-8">
          <div className="absolute inset-0 border-2 border-white/20 rounded-3xl"></div>
          {/* Scanner corners */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-3xl"></div>
          <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-3xl"></div>
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-3xl"></div>
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-3xl"></div>
          
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <QrCode className="h-32 w-32" />
          </div>
          
          {/* Scanner line */}
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-primary shadow-[0_0_15px_rgba(20,184,166,0.8)] animate-[float_3s_ease-in-out_infinite]"></div>
        </div>

        <h2 className="text-xl font-medium mb-2 text-center">Scan any QR code to pay</h2>
        <p className="text-white/60 text-sm text-center max-w-xs">
          Point your camera at a merchant QR code, UPI QR, or a friend's payment code.
        </p>
      </div>

      <div className="p-6 bg-zinc-900/80 backdrop-blur-xl rounded-t-3xl border-t border-white/10 pb-8" data-anim>
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6"></div>
        <div className="flex justify-center gap-4 text-center">
          <div className="flex-1">
            <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2">
              <QrCode className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium">My QR</span>
          </div>
        </div>
      </div>
    </div>
  );
}