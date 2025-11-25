import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Calendar, Clock, Check, ChevronRight, User, 
  Sparkles, Scissors, Hand, Footprints, Info,
  ChevronDown, ChevronUp, MapPin, Phone, Star, Heart
} from 'lucide-react';

// --- Types & Constants ---

type MainServiceType = 'hand' | 'foot' | 'combo' | 'care' | 'wax';

interface ServiceDetailState {
  removal: 'local' | 'other' | 'none';
  style: string;
  extension: boolean;
  extensionCount: number;
  addons: string[];
}

interface BookingState {
  step: number;
  mainService: MainServiceType | null;
  handDetails: ServiceDetailState;
  footDetails: ServiceDetailState;
  careServices: string[];
  waxServices: string[];
  stylist: string | null;
  date: Date | null;
  time: string | null;
  customer: {
    name: string;
    phone: string;
    lineId: string;
    notes: string;
  };
}

const INITIAL_DETAIL_STATE: ServiceDetailState = {
  removal: 'none',
  style: '',
  extension: false,
  extensionCount: 1,
  addons: []
};

const STYLISTS = [
  { id: 'amy', name: 'Amy', title: '首席設計師', specialty: '日式極簡、暈染彩繪', image: 'A' },
  { id: 'bella', name: 'Bella', title: '資深美甲師', specialty: '足部深層護理、矯正', image: 'B' },
  { id: 'coco', name: 'Coco', title: '資深美甲師', specialty: '法式光療、水晶延甲', image: 'C' },
  { id: 'diana', name: 'Diana', title: '保養專家', specialty: '頂級SPA護理、脫毛', image: 'D' },
];

// Price & Duration Constants
const PRICES = {
  base: { hand: 800, foot: 1000, combo: 1500 },
  removal: { local: 0, other: 100, none: 0 },
  style: {
    'solid-cat': 0, 'solid-mirror': 100, 'solid-glitter': 200,
    'design-french': 300, 'design-gradient': 400, 'design-pattern': 500
  },
  extension: 90,
  care: {
    'hand-edge': 400, 'hand-deep': 600,
    'foot-edge': 500, 'foot-care': 800, 'foot-deep': 1000
  },
  wax: {
    'half-arm': 500, 'full-arm': 800, 'half-leg': 700, 'full-leg': 1200,
    'fingers': 200, 'foot-fingers': 200, 'private': 1000
  },
  addons: {
    'hand-deep': 600, 'foot-care': 400, 'foot-deep': 899
  }
};

const DURATIONS = {
  base: { hand: 60, foot: 90, combo: 120 },
  style: {
    'solid-cat': 0, 'solid-mirror': 5, 'solid-glitter': 10,
    'design-french': 15, 'design-gradient': 20, 'design-pattern': 30
  },
  extension: 5,
  care: {
    'hand-edge': 30, 'hand-deep': 45,
    'foot-edge': 30, 'foot-care': 60, 'foot-deep': 75
  },
  wax: {
    'half-arm': 30, 'full-arm': 45, 'half-leg': 45, 'full-leg': 60,
    'fingers': 15, 'foot-fingers': 15, 'private': 45
  },
  addons: {
    'hand-deep': 45, 'foot-care': 60, 'foot-deep': 75
  }
};

// --- Helper Components ---

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-4 mb-6 mt-8">
    <h3 className="text-xl font-serif font-medium text-brand-800 tracking-wide">
      {children}
    </h3>
    <div className="h-[1px] flex-1 bg-brand-200"></div>
  </div>
);

const LuxuryCard = ({ 
  selected, 
  onClick, 
  title, 
  desc, 
  price, 
  badge,
  icon: Icon
}: { 
  selected: boolean; 
  onClick: () => void; 
  title: string; 
  desc?: string; 
  price?: string; 
  badge?: string;
  icon?: any;
}) => (
  <div 
    onClick={onClick}
    className={`
      group relative p-6 rounded-none cursor-pointer transition-all duration-300
      ${selected 
        ? 'bg-white shadow-soft ring-1 ring-brand-300' 
        : 'bg-white/50 hover:bg-white hover:shadow-card border border-transparent hover:border-brand-100'}
    `}
  >
    {/* Elegant Selection Indicator */}
    <div className={`absolute top-0 left-0 w-1 h-full bg-brand-500 transition-all duration-300 ${selected ? 'opacity-100' : 'opacity-0'}`} />
    
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          {Icon && <Icon className={`w-5 h-5 ${selected ? 'text-brand-500' : 'text-stone-400'} transition-colors duration-300`} strokeWidth={1.5} />}
          <h4 className={`text-lg font-serif font-medium tracking-wide ${selected ? 'text-brand-800' : 'text-stone-600'}`}>{title}</h4>
        </div>
        {desc && <p className="text-sm text-stone-500 font-light leading-relaxed">{desc}</p>}
        {badge && (
          <span className="inline-block mt-3 text-[10px] uppercase tracking-widest px-2 py-1 bg-brand-100 text-brand-800 font-medium">
            {badge}
          </span>
        )}
      </div>
      {price && (
        <div className="flex flex-col items-end">
          <span className={`text-lg font-serif ${selected ? 'text-brand-600' : 'text-stone-400'}`}>{price}</span>
          {selected && <Check size={16} className="text-brand-500 mt-2" />}
        </div>
      )}
    </div>
  </div>
);

// --- Main Components ---

const MinimalStepWizard = ({ currentStep }: { currentStep: number }) => {
  const steps = ['Service', 'Stylist', 'Time', 'Confirm'];

  return (
    <div className="w-full bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-brand-100">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex justify-center items-center gap-2 md:gap-12">
          {steps.map((label, index) => {
            const stepNum = index + 1;
            const isActive = currentStep >= stepNum;
            const isCurrent = currentStep === stepNum;
            
            return (
              <div key={label} className="flex items-center">
                <div className={`
                  flex items-center gap-2 text-xs uppercase tracking-widest transition-colors duration-500
                  ${isActive ? 'text-brand-800' : 'text-stone-300'}
                  ${isCurrent ? 'font-bold' : 'font-medium'}
                `}>
                  <span className={`
                    w-5 h-5 flex items-center justify-center rounded-full text-[10px] border
                    ${isActive ? 'border-brand-800 bg-brand-800 text-white' : 'border-stone-200 text-stone-300'}
                  `}>
                    {isActive && !isCurrent ? <Check size={10} /> : stepNum}
                  </span>
                  <span className="hidden md:inline">{label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-[1px] mx-2 md:mx-4 ${isActive && currentStep > stepNum ? 'bg-brand-200' : 'bg-stone-100'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// --- Application ---

const App = () => {
  const [booking, setBooking] = useState<BookingState>({
    step: 1,
    mainService: null,
    handDetails: { ...INITIAL_DETAIL_STATE },
    footDetails: { ...INITIAL_DETAIL_STATE },
    careServices: [],
    waxServices: [],
    stylist: null,
    date: null,
    time: null,
    customer: { name: '', phone: '', lineId: '', notes: '' }
  });

  // Calculate Total Price and Duration
  const totals = useMemo(() => {
    let price = 0;
    let duration = 0;

    const { mainService, handDetails, footDetails, careServices, waxServices } = booking;

    if (mainService && mainService !== 'care' && mainService !== 'wax') {
      price += PRICES.base[mainService];
      duration += DURATIONS.base[mainService];

      const parts = mainService === 'combo' ? ['hand', 'foot'] : [mainService];
      
      parts.forEach(part => {
        const details = part === 'hand' ? handDetails : footDetails;
        price += PRICES.removal[details.removal];
        if (details.style) {
          price += PRICES.style[details.style as keyof typeof PRICES.style] || 0;
          duration += DURATIONS.style[details.style as keyof typeof DURATIONS.style] || 0;
        }
        if (details.extension) {
          price += PRICES.extension * details.extensionCount;
          duration += DURATIONS.extension * details.extensionCount;
        }
        details.addons.forEach(addon => {
          price += PRICES.addons[addon as keyof typeof PRICES.addons] || 0;
          duration += DURATIONS.addons[addon as keyof typeof DURATIONS.addons] || 0;
        });
      });
    }

    careServices.forEach(s => {
      price += PRICES.care[s as keyof typeof PRICES.care] || 0;
      duration += DURATIONS.care[s as keyof typeof DURATIONS.care] || 0;
    });

    waxServices.forEach(s => {
      price += PRICES.wax[s as keyof typeof PRICES.wax] || 0;
      duration += DURATIONS.wax[s as keyof typeof DURATIONS.wax] || 0;
    });

    return { price, duration };
  }, [booking]);

  const updateDetails = (part: 'hand' | 'foot', updates: Partial<ServiceDetailState>) => {
    setBooking(prev => ({
      ...prev,
      [part === 'hand' ? 'handDetails' : 'footDetails']: {
        ...prev[part === 'hand' ? 'handDetails' : 'footDetails'],
        ...updates
      }
    }));
  };

  const nextStep = () => {
    if (booking.step === 1 && totals.duration === 0) {
      alert("請選擇至少一項服務");
      return;
    }
    if (booking.step === 2 && !booking.stylist) {
      alert("請選擇設計師");
      return;
    }
    if (booking.step === 3 && (!booking.date || !booking.time)) {
      alert("請選擇日期與時間");
      return;
    }
    setBooking(prev => ({ ...prev, step: prev.step + 1 }));
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    setBooking(prev => ({ ...prev, step: prev.step - 1 }));
    window.scrollTo(0, 0);
  };

  // --- Step 1: Service Configuration ---
  const renderServiceStep = () => {
    return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-serif text-brand-900 tracking-wide">Select Service</h2>
          <p className="text-stone-500 font-light tracking-wide text-sm uppercase">客製化您的專屬護理療程</p>
        </div>

        <div className="grid grid-cols-1 gap-6 max-w-2xl mx-auto">
          <LuxuryCard 
            title="Hand Care | 手部凝膠" 
            desc="包含指緣軟化、甘皮修剪、甲型修整與凝膠單色" 
            price="NT$ 800"
            icon={Hand}
            selected={booking.mainService === 'hand'}
            onClick={() => setBooking(prev => ({ ...prev, mainService: 'hand' }))}
          />
          <LuxuryCard 
            title="Foot Care | 足部凝膠" 
            desc="包含舒緩足浴、指緣甘皮護理、甲面拋光與凝膠單色" 
            price="NT$ 1000" 
            icon={Footprints}
            selected={booking.mainService === 'foot'}
            onClick={() => setBooking(prev => ({ ...prev, mainService: 'foot' }))}
          />
          <LuxuryCard 
            title="Signature Combo | 經典手足套餐" 
            desc="同時享受手足頂級護理，節省您的寶貴時間" 
            price="NT$ 1500" 
            badge="Recommended"
            icon={Sparkles}
            selected={booking.mainService === 'combo'}
            onClick={() => setBooking(prev => ({ ...prev, mainService: 'combo' }))}
          />
        </div>

        {/* Dynamic Details */}
        <div className="max-w-2xl mx-auto space-y-6">
          {(booking.mainService === 'hand' || booking.mainService === 'combo') && (
            <ServiceDetailConfigurator 
              title="Hand Details" 
              subtitle="手部細項配置"
              type="hand" 
              state={booking.handDetails} 
              onChange={(u) => updateDetails('hand', u)} 
            />
          )}

          {(booking.mainService === 'foot' || booking.mainService === 'combo') && (
            <ServiceDetailConfigurator 
              title="Foot Details" 
              subtitle="足部細項配置"
              type="foot" 
              state={booking.footDetails} 
              onChange={(u) => updateDetails('foot', u)} 
            />
          )}
        </div>

        {/* Add-ons */}
        <div className="max-w-2xl mx-auto pt-8 border-t border-brand-100">
          <div className="text-center mb-8">
            <h3 className="text-lg font-serif text-brand-800">Add-On Services</h3>
            <p className="text-xs text-stone-400 uppercase tracking-widest mt-1">加購護理與除毛</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-4">
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 border-b border-stone-100 pb-2">Spa Care</h4>
                {[
                  { id: 'hand-edge', label: '手指緣保養', price: 400 },
                  { id: 'hand-deep', label: '手部深層保養', price: 600 },
                  { id: 'foot-edge', label: '足部指緣', price: 500 },
                  { id: 'foot-care', label: '足部護理保養', price: 800 },
                  { id: 'foot-deep', label: '足部深層保養', price: 1000 },
                ].map(item => (
                  <label key={item.id} className="flex items-center group cursor-pointer">
                    <div className={`w-5 h-5 border flex items-center justify-center transition-all ${booking.careServices.includes(item.id) ? 'border-brand-500 bg-brand-500' : 'border-stone-300 group-hover:border-brand-300'}`}>
                      {booking.careServices.includes(item.id) && <Check size={12} className="text-white" />}
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={booking.careServices.includes(item.id)}
                      onChange={(e) => {
                         const newCare = e.target.checked 
                           ? [...booking.careServices, item.id]
                           : booking.careServices.filter(id => id !== item.id);
                         setBooking(prev => ({ ...prev, careServices: newCare }));
                      }}
                    />
                    <span className="ml-4 flex-1 text-stone-600 font-light group-hover:text-brand-800 transition-colors">{item.label}</span>
                    <span className="text-stone-400 font-serif text-sm">NT$ {item.price}</span>
                  </label>
                ))}
             </div>

             <div className="space-y-4">
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 border-b border-stone-100 pb-2">Waxing</h4>
                {[
                  { id: 'half-arm', label: '手部半手除毛', price: 500 },
                  { id: 'full-arm', label: '手部全手除毛', price: 800 },
                  { id: 'half-leg', label: '足部半腿除毛', price: 700 },
                  { id: 'full-leg', label: '足部全腿除毛', price: 1200 },
                  { id: 'fingers', label: '手指/足指除毛', price: 200 },
                  { id: 'private', label: '私密處除毛', price: 1000 },
                ].map(item => (
                  <label key={item.id} className="flex items-center group cursor-pointer">
                    <div className={`w-5 h-5 border flex items-center justify-center transition-all ${booking.waxServices.includes(item.id) ? 'border-brand-500 bg-brand-500' : 'border-stone-300 group-hover:border-brand-300'}`}>
                      {booking.waxServices.includes(item.id) && <Check size={12} className="text-white" />}
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={booking.waxServices.includes(item.id)}
                      onChange={(e) => {
                         const newWax = e.target.checked 
                           ? [...booking.waxServices, item.id]
                           : booking.waxServices.filter(id => id !== item.id);
                         setBooking(prev => ({ ...prev, waxServices: newWax }));
                      }}
                    />
                    <span className="ml-4 flex-1 text-stone-600 font-light group-hover:text-brand-800 transition-colors">{item.label}</span>
                    <span className="text-stone-400 font-serif text-sm">NT$ {item.price}</span>
                  </label>
                ))}
             </div>
          </div>
        </div>
      </div>
    );
  };

  // --- Step 2: Stylist Selection ---
  const renderStylistStep = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-4 mb-12">
        <h2 className="text-3xl font-serif text-brand-900 tracking-wide">Select Stylist</h2>
        <p className="text-stone-500 font-light tracking-wide text-sm uppercase">選擇您專屬的美學顧問</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {STYLISTS.map(s => {
          const isSelected = booking.stylist === s.id;
          return (
            <div 
              key={s.id}
              onClick={() => setBooking(prev => ({ ...prev, stylist: s.id }))}
              className={`
                group relative flex items-center p-6 bg-white cursor-pointer transition-all duration-500
                ${isSelected ? 'shadow-soft ring-1 ring-brand-200' : 'hover:shadow-card opacity-80 hover:opacity-100'}
              `}
            >
              {/* Elegant Selection Line */}
              <div className={`absolute bottom-0 left-0 h-[2px] bg-brand-500 transition-all duration-500 ${isSelected ? 'w-full' : 'w-0 group-hover:w-full group-hover:bg-brand-200'}`} />

              <div className="w-20 h-20 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center text-3xl font-serif text-brand-300 mr-6 shadow-inner">
                {s.image}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <h3 className={`text-xl font-serif ${isSelected ? 'text-brand-800' : 'text-stone-700'}`}>{s.name}</h3>
                  {isSelected && <Star size={16} className="text-brand-500 fill-brand-500" />}
                </div>
                <p className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-2">{s.title}</p>
                <p className="text-sm text-stone-500 font-light">{s.specialty}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // --- Step 3: Time Selection ---
  const renderTimeStep = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const dates = Array.from({ length: daysInMonth }, (_, i) => new Date(currentYear, currentMonth, i + 1))
      .filter(d => d >= today); 
    
    const timeSlots = [
      { time: '10:30', type: 'normal', seats: 2 },
      { time: '11:00', type: 'repair', seats: 3 },
      { time: '12:30', type: 'normal', seats: 1 },
      { time: '13:00', type: 'repair', seats: 3 },
      { time: '14:30', type: 'normal', seats: 0 },
      { time: '15:00', type: 'repair', seats: 3 },
      { time: '16:30', type: 'normal', seats: 3 },
      { time: '18:30', type: 'normal', seats: 3 },
      { time: '19:30', type: 'overtime', seats: 3 },
    ];

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
         <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-serif text-brand-900 tracking-wide">Select Time</h2>
            <p className="text-stone-500 font-light tracking-wide text-sm uppercase">
              預計服務時長 <span className="text-brand-600 font-medium ml-1">{totals.duration} min</span>
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-12">
            {/* Date Column */}
            <div className="w-full md:w-1/3">
              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-6 pb-2 border-b border-stone-200">Date</h4>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {dates.map((date) => {
                  const isSelected = booking.date?.toDateString() === date.toDateString();
                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => setBooking(prev => ({ ...prev, date: date, time: null }))}
                      className={`
                        w-full p-4 flex justify-between items-center transition-all duration-300 border-l-2
                        ${isSelected 
                          ? 'bg-white border-brand-500 shadow-sm' 
                          : 'border-transparent hover:bg-white/60 text-stone-400 hover:text-stone-600'}
                      `}
                    >
                      <div className="flex flex-col items-start">
                        <span className={`text-lg font-serif ${isSelected ? 'text-brand-800' : 'text-stone-500'}`}>
                          {date.getDate()}
                        </span>
                        <span className="text-xs uppercase tracking-wider opacity-60">
                          {date.toLocaleString('en-US', { month: 'short' })}
                        </span>
                      </div>
                      <span className="text-xs font-light">
                        {date.toLocaleString('zh-TW', { weekday: 'long' })}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Grid */}
            <div className="w-full md:w-2/3">
              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-6 pb-2 border-b border-stone-200">Time</h4>
              {!booking.date ? (
                <div className="h-64 flex flex-col items-center justify-center text-stone-300 font-light italic bg-stone-50/50 rounded-lg border border-dashed border-stone-200">
                  <Clock size={32} className="mb-3 opacity-30" />
                  <p>Please select a date first</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {timeSlots.map((slot) => {
                    const isFootService = booking.mainService === 'foot' || booking.mainService === 'combo';
                    const isFull = isFootService && slot.seats === 0;
                    const isSelected = booking.time === slot.time;
                    const isDisabled = isFull;

                    return (
                      <button
                        key={slot.time}
                        disabled={isDisabled}
                        onClick={() => setBooking(prev => ({ ...prev, time: slot.time }))}
                        className={`
                          relative py-4 px-2 text-center transition-all duration-300
                          ${isSelected 
                            ? 'bg-brand-800 text-white shadow-lg transform scale-105' 
                            : isDisabled 
                              ? 'bg-stone-100 text-stone-300 cursor-not-allowed'
                              : 'bg-white text-stone-600 hover:bg-brand-50 hover:text-brand-800 shadow-sm'
                          }
                        `}
                      >
                        <div className="text-xl font-serif tracking-widest">{slot.time}</div>
                        
                        {(isFull || (isFootService && slot.seats < 2)) && (
                           <div className="mt-2 text-[10px] uppercase tracking-wider font-medium">
                             {isFull ? <span className="text-red-300">Full</span> : <span className="text-brand-400">Limited</span>}
                           </div>
                        )}
                        {!isFull && !isDisabled && !isSelected && (
                           <div className="mt-2 h-1 w-8 bg-stone-100 mx-auto rounded-full overflow-hidden">
                             <div className="h-full bg-brand-200 w-full" /> 
                           </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
      </div>
    );
  };

  // --- Step 4: Confirmation ---
  const renderConfirmStep = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto">
      <div className="text-center space-y-4 mb-12">
        <h2 className="text-3xl font-serif text-brand-900 tracking-wide">Confirm Details</h2>
        <p className="text-stone-500 font-light tracking-wide text-sm uppercase">確認您的預約資訊</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* Booking Summary Card */}
        <div className="bg-white p-8 shadow-soft relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-300 to-brand-500" />
          
          <h3 className="text-lg font-serif text-brand-900 mb-8 pb-4 border-b border-stone-100 flex justify-between items-center">
            <span>Booking Summary</span>
            <Sparkles size={16} className="text-brand-400" />
          </h3>
          
          <dl className="space-y-6 text-sm">
            <div className="flex justify-between">
              <dt className="text-stone-400 font-light uppercase tracking-wider">Date & Time</dt>
              <dd className="font-serif text-lg text-brand-800">
                {booking.date?.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})} <span className="mx-2">|</span> {booking.time}
              </dd>
            </div>
            
            <div className="flex justify-between">
              <dt className="text-stone-400 font-light uppercase tracking-wider">Stylist</dt>
              <dd className="font-medium text-stone-700">{STYLISTS.find(s => s.id === booking.stylist)?.name}</dd>
            </div>

            <div className="pt-6 border-t border-stone-100">
              <dt className="text-stone-400 font-light uppercase tracking-wider mb-2">Service</dt>
              <dd className="text-lg font-serif text-stone-800 mb-1">
                {booking.mainService === 'hand' ? 'Hand Care' : 
                 booking.mainService === 'foot' ? 'Foot Care' : 'Signature Combo'}
              </dd>
              {/* Optional: Add breakdown of extras here */}
            </div>

            <div className="pt-6 border-t border-stone-100 flex justify-between items-end">
               <div>
                  <dt className="text-stone-400 font-light uppercase tracking-wider mb-1">Total</dt>
                  <dd className="text-stone-500 text-xs">{totals.duration} mins</dd>
               </div>
               <dd className="text-3xl font-serif text-brand-600">NT$ {totals.price}</dd>
            </div>
          </dl>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">Name</label>
            <input 
              type="text"
              value={booking.customer.name}
              onChange={e => setBooking(prev => ({...prev, customer: {...prev.customer, name: e.target.value}}))}
              className="w-full bg-white border-0 border-b border-stone-200 focus:border-brand-500 focus:ring-0 px-0 py-3 transition-colors text-stone-700 placeholder-stone-300"
              placeholder="Your full name"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">Phone</label>
            <input 
              type="tel"
              value={booking.customer.phone}
              onChange={e => setBooking(prev => ({...prev, customer: {...prev.customer, phone: e.target.value}}))}
              className="w-full bg-white border-0 border-b border-stone-200 focus:border-brand-500 focus:ring-0 px-0 py-3 transition-colors text-stone-700 placeholder-stone-300"
              placeholder="09xx-xxx-xxx"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">Line ID (Optional)</label>
            <input 
              type="text"
              value={booking.customer.lineId}
              onChange={e => setBooking(prev => ({...prev, customer: {...prev.customer, lineId: e.target.value}}))}
              className="w-full bg-white border-0 border-b border-stone-200 focus:border-brand-500 focus:ring-0 px-0 py-3 transition-colors text-stone-700 placeholder-stone-300"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">Notes</label>
            <textarea 
              rows={3}
              value={booking.customer.notes}
              onChange={e => setBooking(prev => ({...prev, customer: {...prev.customer, notes: e.target.value}}))}
              className="w-full bg-white border-0 border-b border-stone-200 focus:border-brand-500 focus:ring-0 px-0 py-3 transition-colors text-stone-700 placeholder-stone-300 resize-none"
              placeholder="Special requests..."
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-32 font-sans selection:bg-brand-200 selection:text-brand-900">
      {/* Brand Header */}
      <header className="bg-sand-50 pt-8 pb-6 px-6 text-center">
        <h1 className="text-4xl font-serif tracking-[0.2em] text-brand-900 mb-2">GLOW</h1>
        <p className="text-[10px] uppercase tracking-[0.3em] text-brand-500">Premium Nail Salon</p>
      </header>

      <MinimalStepWizard currentStep={booking.step} />

      <main className="max-w-6xl mx-auto px-6 py-12">
        {booking.step === 1 && renderServiceStep()}
        {booking.step === 2 && renderStylistStep()}
        {booking.step === 3 && renderTimeStep()}
        {booking.step === 4 && renderConfirmStep()}
      </main>

      {/* Floating Glass Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-lg border-t border-white/20 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50 p-4 md:p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Estimated Total</div>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-serif text-brand-800">NT$ {totals.price}</span>
              <span className="text-sm font-light text-stone-500">{totals.duration} mins</span>
            </div>
          </div>
          
          <div className="flex gap-4">
             {booking.step > 1 && (
               <button 
                onClick={prevStep}
                className="px-6 py-3 rounded-full text-stone-500 hover:bg-stone-100 transition-colors text-sm font-medium tracking-wide uppercase"
               >
                 Back
               </button>
             )}
             <button 
               onClick={booking.step === 4 ? () => alert("Thank you for your booking.") : nextStep}
               className="px-8 py-3 rounded-full bg-brand-800 text-white hover:bg-brand-900 transition-all duration-300 shadow-lg shadow-brand-200 text-sm font-bold tracking-widest uppercase"
             >
               {booking.step === 4 ? 'Confirm' : 'Next Step'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-Component: Detail Configurator ---

const ServiceDetailConfigurator = ({ 
  title, 
  subtitle,
  type, 
  state, 
  onChange 
}: { 
  title: string;
  subtitle: string; 
  type: 'hand' | 'foot'; 
  state: ServiceDetailState;
  onChange: (u: Partial<ServiceDetailState>) => void;
}) => {
  const [isOpen, setIsOpen] = useState(true);

  // Constants
  const styleOptions = [
    { id: 'solid-cat', label: '貓眼單色', price: 0 },
    { id: 'solid-mirror', label: '鏡面單色', price: 100 },
    { id: 'solid-glitter', label: '碎鑽單色', price: 200 },
    { id: 'design-french', label: '法式美甲', price: 300 },
    { id: 'design-gradient', label: '漸層美甲', price: 400 },
    { id: 'design-pattern', label: '圖案彩繪', price: 500 },
  ];

  const addonOptions = type === 'hand' 
    ? [{ id: 'hand-deep', label: '深層保養', price: 600 }]
    : [
        { id: 'foot-care', label: '足部護理', price: 400 },
        { id: 'foot-deep', label: '深層保養', price: 899 },
      ];

  return (
    <div className="bg-white rounded-none border-l-2 border-brand-200 pl-6 py-2 transition-all duration-500 hover:border-brand-400">
      <div 
        className="flex items-center justify-between cursor-pointer group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div>
          <h4 className="text-lg font-serif text-brand-900 group-hover:text-brand-600 transition-colors">{title}</h4>
          <p className="text-xs text-stone-400 font-light tracking-wide uppercase">{subtitle}</p>
        </div>
        <div className={`transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown className="text-brand-300" size={20} strokeWidth={1.5} />
        </div>
      </div>
      
      <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-6' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden space-y-8">
          
          {/* Removal Section */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-stone-300 uppercase tracking-widest">Removal</h5>
            <div className="flex gap-4">
              {[
                { id: 'none', label: 'None', sub: '無卸甲', price: 0 },
                { id: 'local', label: 'Return', sub: '本店卸甲', price: 0 },
                { id: 'other', label: 'Other', sub: '他店卸甲', price: 100 },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => onChange({ removal: opt.id as any })}
                  className={`
                    group relative px-4 py-3 text-left transition-all duration-300 min-w-[100px]
                    ${state.removal === opt.id ? 'bg-brand-50' : 'bg-transparent hover:bg-stone-50'}
                  `}
                >
                  {state.removal === opt.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-6 bg-brand-500" />}
                  <div className={`text-sm font-serif ${state.removal === opt.id ? 'text-brand-800' : 'text-stone-500'}`}>{opt.label}</div>
                  <div className="text-[10px] text-stone-400 mt-1">{opt.sub} {opt.price > 0 && `+$${opt.price}`}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Style Section */}
          <div className="space-y-3">
             <h5 className="text-xs font-bold text-stone-300 uppercase tracking-widest">Style</h5>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
               {styleOptions.map(opt => (
                 <button
                  key={opt.id}
                  onClick={() => onChange({ style: opt.id })}
                  className={`
                    px-4 py-3 text-left border transition-all duration-300
                    ${state.style === opt.id 
                      ? 'border-brand-300 bg-white shadow-soft text-brand-800' 
                      : 'border-transparent bg-stone-50 text-stone-500 hover:bg-stone-100'}
                  `}
                 >
                   <span className="text-sm block mb-1">{opt.label}</span>
                   {opt.price > 0 && <span className="text-[10px] text-stone-400">+ NT$ {opt.price}</span>}
                 </button>
               ))}
             </div>
          </div>

          {/* Extension & Addons Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-stone-100 border-dashed">
            
            {/* Extension */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <input 
                  type="checkbox" 
                  id={`ext-${type}`}
                  className="hidden"
                  checked={state.extension} 
                  onChange={e => onChange({ extension: e.target.checked })} 
                />
                <label 
                  htmlFor={`ext-${type}`}
                  className={`
                    w-10 h-5 rounded-full relative cursor-pointer transition-colors duration-300
                    ${state.extension ? 'bg-brand-400' : 'bg-stone-200'}
                  `}
                >
                  <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-300 ${state.extension ? 'translate-x-5' : ''}`} />
                </label>
                <span className="text-sm text-stone-600 font-medium">Nail Extension (延甲)</span>
              </div>
              
              {state.extension && (
                <div className="flex items-center gap-4 pl-2 animate-in fade-in">
                  <span className="text-xs text-stone-400 uppercase">Quantity</span>
                  <div className="flex items-center border border-stone-200 rounded-full px-2">
                    <button onClick={() => onChange({ extensionCount: Math.max(1, state.extensionCount - 1) })} className="px-3 py-1 text-stone-400 hover:text-brand-600">-</button>
                    <span className="font-serif w-6 text-center text-brand-800">{state.extensionCount}</span>
                    <button onClick={() => onChange({ extensionCount: Math.min(10, state.extensionCount + 1) })} className="px-3 py-1 text-stone-400 hover:text-brand-600">+</button>
                  </div>
                </div>
              )}
            </div>

            {/* Addons */}
            <div>
              <h5 className="text-xs font-bold text-stone-300 uppercase tracking-widest mb-3">Upgrade</h5>
              <div className="space-y-2">
                {addonOptions.map(opt => (
                  <label key={opt.id} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${state.addons.includes(opt.id) ? 'border-brand-500' : 'border-stone-300 group-hover:border-brand-300'}`}>
                      <div className={`w-2 h-2 rounded-full bg-brand-500 transition-transform ${state.addons.includes(opt.id) ? 'scale-100' : 'scale-0'}`} />
                    </div>
                    <input 
                      type={type === 'foot' ? "radio" : "checkbox"}
                      name={`${type}-addon`}
                      className="hidden"
                      checked={state.addons.includes(opt.id)}
                      onChange={(e) => {
                         if (type === 'foot') {
                            onChange({ addons: e.target.checked ? [opt.id] : [] });
                         } else {
                            const newAddons = e.target.checked 
                              ? [...state.addons, opt.id] 
                              : state.addons.filter(a => a !== opt.id);
                            onChange({ addons: newAddons });
                         }
                      }}
                    />
                    <span className="text-sm text-stone-600">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}