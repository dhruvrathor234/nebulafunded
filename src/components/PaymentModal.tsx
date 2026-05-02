import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Wallet, 
  QrCode, 
  Copy, 
  CheckCircle2, 
  Upload, 
  AlertCircle,
  Smartphone,
  Bitcoin,
  Image as ImageIcon,
  Loader2
} from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  challengeData: {
    id: string;
    title: string;
    price: string | number;
    size: number;
  } | null;
  onPaymentSubmit: (screenshot: string) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, challengeData, onPaymentSubmit }) => {
  const [method, setMethod] = useState<'UPI' | 'CRYPTO'>('UPI');
  const [copied, setCopied] = useState<string | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'IDLE' | 'SCANNING' | 'ANALYZING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [detectedAmount, setDetectedAmount] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!challengeData) return null;

  const upiId = "7303325930@ybl";
  const cryptoDetails = {
    erc20: "0xf725af6ad4bd8340b3e9e39758d9ef6f7cfcc371",
    trc20: "TEbdmue8iCNho6ChGmbXTv8f9btXcXMkWo"
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
        setVerificationStep('IDLE');
      };
      reader.readAsDataURL(file);
    }
  };

  const USD_TO_INR = 83.5;
  const originalPriceUSD = typeof challengeData.price === 'number' 
    ? challengeData.price 
    : parseFloat(challengeData.price.toString().replace(/[^0-9.]/g, ''));
  
  const is5KPlan = challengeData.id === 'starter-5k';
  let discountMultiplier = 1;
  if (!is5KPlan) {
    if (appliedCoupon === 'WELCOME30') discountMultiplier = 0.7;
    else if (appliedCoupon === 'REVISIT') discountMultiplier = 0.8;
    else if (appliedCoupon === 'OFF25') discountMultiplier = 0.75;
  }
  const priceUSD = originalPriceUSD * discountMultiplier;
  const priceINR = Math.round(priceUSD * USD_TO_INR);

  const handleApplyCoupon = () => {
    const code = couponInput.toUpperCase();
    const validCoupons = ['WELCOME30', 'REVISIT', 'OFF25'];
    
    if (validCoupons.includes(code)) {
      if (is5KPlan) {
        alert("Sorry, coupons are not applicable for the 5K plan.");
      } else {
        setAppliedCoupon(code);
        setCouponInput("");
      }
    } else {
      alert("Invalid coupon code.");
    }
  };

  const handleSubmit = async () => {
    if (!screenshot) {
      alert("Please upload a payment screenshot first.");
      return;
    }
    
    setIsSubmitting(true);
    setVerificationStep('SCANNING');

    // Simulate Scanning
    await new Promise(r => setTimeout(r, 2000));
    setVerificationStep('ANALYZING');
    
    // Simulate analyzing the amount from the image
    await new Promise(r => setTimeout(r, 2500));

    // For the demo, we simulate extraction. 
    // In a real app, this would be OCR result.
    const priceAmount = method === 'UPI' 
      ? priceINR.toString()
      : priceUSD.toString();
    
    setDetectedAmount(priceAmount);
    setVerificationStep('SUCCESS');

    // Final delay before activation
    await new Promise(r => setTimeout(r, 1500));
    
    onPaymentSubmit(screenshot);
    setIsSubmitting(false);
    onClose();
    setScreenshot(null);
    setVerificationStep('IDLE');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isSubmitting ? onClose : undefined}
            className="absolute inset-0 bg-primary/95 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl glass rounded-[2.5rem] border-white/5 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div>
                <h2 className="text-2xl font-display font-bold uppercase tracking-tighter">
                  {verificationStep === 'IDLE' ? 'Purchase Challenge' : 'Verifying Payment'}
                </h2>
                <p className="text-white/40 text-xs mt-1">
                  {verificationStep === 'IDLE' ? 'Select payment method & upload proof' : 'System is cross-verifying your transaction'}
                </p>
              </div>
              {!isSubmitting && (
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5 text-white/60" />
                </button>
              )}
            </div>

            <div className="flex-grow overflow-y-auto no-scrollbar p-8">
              {verificationStep === 'IDLE' ? (
                <>
                  {/* Challenge summary */}
                  <div className="glass p-6 rounded-3xl border-white/5 mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-accent-blue/10 flex items-center justify-center text-accent-blue">
                        <Wallet className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-white/40 text-[10px] uppercase font-black tracking-widest">Plan</div>
                        <div className="font-bold">{challengeData.title}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white/40 text-[10px] uppercase font-black tracking-widest">Amount Due</div>
                      <div className="text-2xl font-display font-bold text-accent-blue">
                        {method === 'UPI' ? `₹${priceINR.toLocaleString('en-IN')}` : `$${priceUSD.toFixed(2)}`}
                      </div>
                      {appliedCoupon && !is5KPlan && (
                        <div className="text-[10px] text-success font-bold uppercase tracking-widest animate-pulse">
                          {appliedCoupon === 'WELCOME30' ? '30%' : (appliedCoupon === 'REVISIT' ? '20%' : '25%')} Discount Applied
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Method Tabs */}
                  <div className="flex gap-4 mb-8">
                    <button 
                      onClick={() => setMethod('UPI')}
                      className={`flex-1 py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all border ${method === 'UPI' ? 'bg-accent-blue/10 border-accent-blue text-accent-blue' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'}`}
                    >
                      <Smartphone className="w-5 h-5" />
                      <span className="font-bold text-sm">Local UPI</span>
                    </button>
                    <button 
                      onClick={() => setMethod('CRYPTO')}
                      className={`flex-1 py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all border ${method === 'CRYPTO' ? 'bg-accent-blue/10 border-accent-blue text-accent-blue' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'}`}
                    >
                      <Bitcoin className="w-5 h-5" />
                      <span className="font-bold text-sm">Crypto USDT</span>
                    </button>
                  </div>

                  {/* Payment Details */}
                  <div className="space-y-6 mb-8">
                    {method === 'UPI' ? (
                      <div className="space-y-4">
                        <div className="p-6 bg-[#6739B7]/5 rounded-[2rem] border border-white/5">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                              <Smartphone className="w-5 h-5 text-accent-blue" />
                              <span className="text-white/60 font-bold text-sm uppercase">Direct UPI Payment</span>
                            </div>
                            <div className="text-[10px] font-black text-accent-blue bg-accent-blue/10 px-2 py-1 rounded">FASTEST</div>
                          </div>
                          
                          <div className="space-y-6">
                            <div className="text-center py-4">
                              <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mb-2">Amount to Transfer</p>
                              <p className="text-3xl font-display font-bold text-white">₹{priceINR.toLocaleString('en-IN')}</p>
                            </div>

                            <div className="glass p-4 rounded-xl border-white/5">
                              <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mb-2 text-center">UPI ID (VPA)</p>
                              <div className="flex items-center gap-3 bg-primary/50 p-3 rounded-xl border border-white/10 group">
                                <div className="font-mono text-white/80 font-bold truncate flex-grow text-center ml-4">{upiId}</div>
                                <button onClick={() => copyToClipboard(upiId, 'upi')} className="flex-shrink-0 text-accent-blue hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg">
                                  {copied === 'upi' ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                </button>
                              </div>
                            </div>

                            <div className="p-4 bg-accent-blue/5 rounded-xl border border-accent-blue/10">
                              <p className="text-[10px] text-accent-blue/80 font-bold leading-relaxed text-center uppercase tracking-tight">
                                Pay exactly the amount shown above to the UPI ID and upload the success screenshot below.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">USDT (ERC20)</span>
                            <div className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">Ethereum Network</div>
                          </div>
                          <div className="flex items-center gap-3 bg-primary/50 p-3 rounded-xl border border-white/5">
                            <div className="font-mono text-xs text-white/60 truncate flex-grow">{cryptoDetails.erc20}</div>
                            <button onClick={() => copyToClipboard(cryptoDetails.erc20, 'erc')} className="flex-shrink-0 text-accent-blue hover:text-white transition-colors">
                              {copied === 'erc' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">USDT (TRC20)</span>
                            <div className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">Tron Network</div>
                          </div>
                          <div className="flex items-center gap-3 bg-primary/50 p-3 rounded-xl border border-white/5">
                            <div className="font-mono text-xs text-white/60 truncate flex-grow">{cryptoDetails.trc20}</div>
                            <button onClick={() => copyToClipboard(cryptoDetails.trc20, 'trc')} className="flex-shrink-0 text-accent-blue hover:text-white transition-colors">
                              {copied === 'trc' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-4 bg-accent-blue/5 rounded-2xl border border-accent-blue/10">
                          <AlertCircle className="w-5 h-5 text-accent-blue flex-shrink-0 mt-0.5" />
                          <p className="text-[11px] text-white/60 leading-relaxed italic">
                            Minimum payment: <span className="text-white font-bold">0.1 USDT</span>. Please ensure you select the correct network (ERC20 or TRC20).
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Coupon Code Section */}
                  <div className="mb-8">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 ml-1">Have a Coupon?</h4>
                    <div className="flex gap-2">
                       <input 
                        type="text"
                        placeholder="ENTER CODE (e.g. WELCOME30)"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        className="flex-grow bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold placeholder:text-white/10 focus:border-accent-blue/50 outline-none transition-all uppercase"
                        disabled={!!appliedCoupon}
                       />
                       <button 
                        onClick={handleApplyCoupon}
                        disabled={!couponInput || !!appliedCoupon}
                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${!couponInput || !!appliedCoupon ? 'bg-white/5 text-white/20' : 'bg-white/10 text-white hover:bg-white/20'}`}
                       >
                        {appliedCoupon ? 'APPLIED' : 'APPLY'}
                       </button>
                    </div>
                  </div>

                  {/* Screenshot Upload */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-white/60">Upload Proof</h4>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative cursor-pointer border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center transition-all ${screenshot ? 'border-success/50 bg-success/5' : 'border-white/10 hover:border-accent-blue/50 hover:bg-white/5'}`}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/*" 
                        className="hidden" 
                      />
                      
                      {screenshot ? (
                        <div className="text-center">
                          <div className="w-16 h-16 rounded-2xl bg-success/20 flex items-center justify-center mx-auto mb-4">
                            <ImageIcon className="w-8 h-8 text-success" />
                          </div>
                          <p className="text-sm font-bold text-success mb-1">Screenshot Uploaded!</p>
                          <p className="text-[10px] text-white/40">Click to change file</p>
                          <div className="mt-4 p-2 glass rounded-xl inline-block max-w-[200px] overflow-hidden">
                            <img src={screenshot} alt="Payment Proof" className="w-full h-auto rounded-lg max-h-32 object-cover opacity-50" />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                            <Upload className="w-8 h-8 text-white/20" />
                          </div>
                          <p className="text-sm font-bold text-white/60 mb-1">Upload Transaction Screenshot</p>
                          <p className="text-[10px] text-white/30 uppercase tracking-widest">PNG, JPG up to 5MB</p>
                        </>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative w-64 h-64 mb-8">
                    {/* The scanning image */}
                    <div className="absolute inset-0 glass rounded-3xl border-white/10 overflow-hidden">
                      <img src={screenshot || ''} alt="Scanning" className="w-full h-full object-cover opacity-30 grayscale" />
                      
                      {/* Scanning Line */}
                      {verificationStep === 'SCANNING' && (
                        <motion.div 
                          initial={{ top: 0 }}
                          animate={{ top: '100%' }}
                          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                          className="absolute left-0 right-0 h-1 bg-accent-blue shadow-[0_0_15px_rgba(0,245,255,0.8)] z-10"
                        />
                      )}

                      {/* Success Check Overlay */}
                      {verificationStep === 'SUCCESS' && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute inset-0 flex items-center justify-center bg-success/10 backdrop-blur-[2px]"
                        >
                          <CheckCircle2 className="w-32 h-32 text-success" />
                        </motion.div>
                      )}
                    </div>

                    {/* Circular radar background */}
                    <div className="absolute -inset-4 border border-white/5 rounded-full animate-pulse" />
                    <div className="absolute -inset-8 border border-white/5 rounded-full animate-pulse delay-75" />
                  </div>

                  <div className="text-center space-y-4">
                    <h3 className="text-2xl font-display font-bold uppercase tracking-tight">
                      {verificationStep === 'SCANNING' && 'Scanning Receipt...'}
                      {verificationStep === 'ANALYZING' && 'Analyzing Amount & TXID...'}
                      {verificationStep === 'SUCCESS' && 'Verification Complete'}
                    </h3>
                    
                    <div className="flex flex-col gap-2">
                       <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/40 glass p-3 rounded-xl border-white/5 min-w-[280px]">
                         <span>Detected Amount</span>
                         <span className={verificationStep === 'SCANNING' ? 'animate-pulse' : 'text-accent-blue'}>
                           {verificationStep === 'SCANNING' ? 'WAITING...' : `${method === 'UPI' ? '₹' : ''}${detectedAmount}${method === 'CRYPTO' ? ' USDT' : ''}`}
                         </span>
                       </div>
                       <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/40 glass p-3 rounded-xl border-white/5">
                         <span>Transaction Status</span>
                         <span className={verificationStep === 'SCANNING' || verificationStep === 'ANALYZING' ? 'text-accent-blue animate-pulse' : 'text-success'}>
                           {verificationStep === 'SCANNING' || verificationStep === 'ANALYZING' ? 'PENDING' : 'CONFIRMED'}
                         </span>
                       </div>
                    </div>

                    <div className="pt-4 flex items-center justify-center gap-3">
                      <Loader2 className="w-5 h-5 text-accent-blue animate-spin" />
                      <span className="text-xs text-white/60">
                        {verificationStep === 'SCANNING' && 'OCR modules initialized...'}
                        {verificationStep === 'ANALYZING' && 'Cross-referencing with blockchain/bank...'}
                        {verificationStep === 'SUCCESS' && 'Signature match confirmed. Activating...'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {verificationStep === 'IDLE' && (
              <div className="p-8 border-t border-white/5 bg-white/[0.02]">
                <button 
                  onClick={handleSubmit}
                  disabled={!screenshot || isSubmitting}
                  className={`w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg transition-all ${!screenshot || isSubmitting ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-accent-blue text-primary shadow-accent-blue/20 hover:scale-[1.02]'}`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Confirm & Activate Account</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-center text-white/20 mt-4 uppercase tracking-widest">
                  Account will be activated immediately after AI verification
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;
