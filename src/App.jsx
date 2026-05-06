import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingCart, MapPin, Clock, Menu as MenuIcon, X, 
  CheckCircle, Star, Plus, Minus, MessageCircle, Search, 
  ArrowRight, Utensils, ChevronLeft, Zap, WifiOff, 
  AlertTriangle, ShieldCheck, Check 
} from 'lucide-react';

// --- SYSTEM CONFIGURATION ---
const SYSTEM_CONFIG = {
  // CRITICAL: Replace with your actual WhatsApp number for the pitch! (e.g. "23354XXXXXXX")
  whatsappNumber: "233506728272", 
  businessName: "Taste N Tell",
  deliveryTime: "15–30 mins" 
};

// --- DEFAULT STRUCTURED MENU DATA ---
const DEFAULT_MENU_ITEMS = [
  {
    id: 1,
    name: 'Classic Ghana Jollof & Chicken',
    category: 'Rice Dishes',
    price: 45.00,
    description: 'Smoky, spicy party jollof served with grilled chicken, coleslaw, and shito.',
    image: 'https://images.unsplash.com/photo-1604329760661-e71c0c144ce2?auto=format&fit=crop&w=600&q=80',
    popular: true,
    available: true,
  },
  {
    id: 2,
    name: 'Assorted Meat Fried Rice',
    category: 'Rice Dishes',
    price: 55.00,
    description: 'Stir-fried rice with beef, chicken, sausage, and fresh vegetables.',
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80',
    popular: false,
    available: true,
  },
  {
    id: 3,
    name: 'Red Red (Beans & Plantain)',
    category: 'Local Specials',
    price: 35.00,
    description: 'Traditional black-eyed pea stew cooked in palm oil, served with fried ripe plantain.',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    popular: true,
    available: true,
  },
  {
    id: 4,
    name: 'Banku & Grilled Tilapia',
    category: 'Local Specials',
    price: 70.00,
    description: 'Two balls of soft banku with a large spiced grilled tilapia and fresh hot pepper.',
    image: 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?auto=format&fit=crop&w=600&q=80',
    popular: true,
    available: true,
  },
  {
    id: 5,
    name: 'Sunday Special Omotuo',
    category: 'Local Specials',
    price: 60.00,
    description: 'Soft rice balls served with rich groundnut soup and assorted meat. (Sundays Only)',
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80',
    popular: false,
    available: false,
  },
  {
    id: 6,
    name: 'Spicy Kelewele',
    category: 'Sides',
    price: 15.00,
    description: 'Perfectly diced ripe plantains marinated in ginger, onions, and chili, fried to perfection.',
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&q=80',
    popular: false,
    available: true,
  },
  {
    id: 7,
    name: 'Chilled Sobolo',
    category: 'Drinks',
    price: 10.00,
    description: 'Refreshing hibiscus tea brewed with ginger, pineapple, and cloves. Served chilled.',
    image: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=600&q=80',
    popular: true,
    available: true,
  }
];

const MENU_CATEGORIES = ['All', 'Rice Dishes', 'Local Specials', 'Sides', 'Drinks'];

const DELIVERY_ZONES = [
  "Valco Hall", "Atlantic (ATL) Hall", "Casely Hayford Hall", 
  "Kwame Nkrumah Hall", "Amamoma Hostels", "Kwaprow Area"
];

// --- MAIN APPLICATION COMPONENT ---
export default function App() {
  // Global & Network State
  const [isOffline, setIsOffline] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  
  // UI State
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [toastMessage, setToastMessage] = useState(null);
  
  // Form State & Validation
  const [customerDetails, setCustomerDetails] = useState({ name: '', phone: '', location: '', notes: '' });
  const [formErrors, setFormErrors] = useState({});

  // Order Tracking Mock State
  const [trackingId, setTrackingId] = useState('');
  const [trackingResult, setTrackingResult] = useState(null);

  // Initialization: Load Menu & Network Listeners
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    if (typeof navigator !== 'undefined') setIsOffline(!navigator.onLine);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    try {
      const storedMenu = localStorage.getItem('tnt_menu');
      if (storedMenu) {
        setMenuItems(JSON.parse(storedMenu));
      } else {
        setMenuItems(DEFAULT_MENU_ITEMS);
        localStorage.setItem('tnt_menu', JSON.stringify(DEFAULT_MENU_ITEMS));
      }
    } catch (e) {
      console.error("Failed to load menu", e);
      setMenuItems(DEFAULT_MENU_ITEMS);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Derived State
  const cartTotal = useMemo(() => cart.reduce((total, item) => total + (item.price * item.quantity), 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((count, item) => count + item.quantity, 0), [cart]);
  
  const filteredMenu = useMemo(() => {
    let items = activeCategory === 'All' ? menuItems : menuItems.filter(item => item.category === activeCategory);
    return items.sort((a, b) => (a.popular === b.popular ? 0 : a.popular ? -1 : 1));
  }, [activeCategory, menuItems]);

  // --- ACTIONS & HANDLERS ---
  const addToCart = (item) => {
    if (!item.available) return;
    
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    
    setToastMessage(`Added ${item.name} to order!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0)); 
    
    if (cartCount + delta <= 0) setTimeout(() => setIsCartOpen(false), 300);
  };

  const verifyWhatsAppConfig = () => {
    if (!SYSTEM_CONFIG.whatsappNumber) {
      alert("System Error: WhatsApp number is not configured.");
      return false;
    }
    if (isOffline) {
      alert("You appear to be offline. Please check your internet connection.");
      return false;
    }
    return true;
  };

  const handleQuickOrder = (item) => {
    if (!item.available) return;
    if (!verifyWhatsAppConfig()) return;
    
    let text = `*⚡ Quick Order | ${SYSTEM_CONFIG.businessName}*\n\n`;
    text += `Hello, I'd like to quickly order:\n`;
    text += `*1x ${item.name}* (GHS ${item.price.toFixed(2)})\n\n`;
    text += `_Please let me know the delivery fee and estimated time._\n`;
    text += `\n*My Name:* [Type Name]\n*My Location:* [Type Location]`;

    window.open(`https://wa.me/${SYSTEM_CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCheckout = (e) => {
    e.preventDefault();
    if (!verifyWhatsAppConfig()) return;

    const errors = {};
    if (!customerDetails.name.trim()) errors.name = "Name is required";
    if (!customerDetails.phone.trim()) errors.phone = "Phone is required";
    if (!customerDetails.location.trim()) errors.location = "Location is required";
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    const timestamp = new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
    
    let orderText = `*🛒 New Order | ${SYSTEM_CONFIG.businessName}*\n`;
    orderText += `*Date:* ${timestamp}\n`;
    orderText += `---------------------------\n`;
    orderText += `*Customer:* ${customerDetails.name}\n`;
    orderText += `*Phone:* ${customerDetails.phone}\n`;
    orderText += `*Delivery Location:* ${customerDetails.location}\n`;
    orderText += `---------------------------\n`;
    orderText += `*Order Items:*\n`;
    cart.forEach(item => {
      orderText += `▪ ${item.quantity}x ${item.name} - GHS ${(item.price * item.quantity).toFixed(2)}\n`;
    });
    orderText += `---------------------------\n`;
    orderText += `*Subtotal:* GHS ${cartTotal.toFixed(2)}\n`;
    
    if (customerDetails.notes) {
      orderText += `\n*Special Notes:* _${customerDetails.notes}_\n`;
    }

    const whatsappUrl = `https://wa.me/${SYSTEM_CONFIG.whatsappNumber}?text=${encodeURIComponent(orderText)}`;
    window.open(whatsappUrl, '_blank');
    
    setCart([]);
    setIsCartOpen(false);
    setCheckoutStep(1);
    setCustomerDetails({ name: '', phone: '', location: '', notes: '' });
    setFormErrors({});
  };

  const handleTrackOrder = (e) => {
    e.preventDefault();
    if (trackingId.length < 3) return;
    setTrackingResult({ status: 'Preparing', timeElapsed: '15 mins', estimatedArrival: '25 mins' });
  };

  const scrollToSection = (id) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80; 
      window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY + yOffset, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-800">
      
      {/* --- SUCCESS TOAST NOTIFICATION --- */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] bg-stone-900 text-white px-5 py-3 rounded-full shadow-xl flex items-center gap-3 animate-fade-in-down text-sm font-bold w-max max-w-[90vw]">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shrink-0">
            <Check size={14} className="text-white" />
          </div>
          {toastMessage}
        </div>
      )}

      {/* --- OFFLINE NOTIFICATION --- */}
      {isOffline && (
        <div className="bg-red-600 text-white py-2 px-4 text-sm font-bold flex items-center justify-center gap-2 z-[60] sticky top-0 w-full animate-fade-in-down">
          <WifiOff size={16} />
          <span>You are offline. Please check your internet connection.</span>
        </div>
      )}

      {/* --- URGENCY BANNER --- */}
      {!isOffline && (
        <div className="bg-orange-600 text-white text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 z-50 relative">
          <Zap size={16} className="animate-pulse" />
          <span>Fast Delivery: Orders currently take <strong>{SYSTEM_CONFIG.deliveryTime}</strong>. Order now!</span>
        </div>
      )}

      {/* --- NAVIGATION --- */}
      <nav className="sticky top-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-sm z-40 border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
              <div className="w-10 h-10 bg-orange-600 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-orange-200 transition-transform hover:scale-105">
                T
              </div>
              <div>
                <h1 className="font-extrabold text-xl text-stone-900 tracking-tight leading-none">{SYSTEM_CONFIG.businessName}</h1>
                <span className="text-[10px] text-orange-600 font-bold tracking-widest uppercase">UCC Campus</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('menu')} className="font-bold text-stone-600 hover:text-orange-600 transition-colors">Menu</button>
              <button onClick={() => scrollToSection('delivery-zones')} className="font-bold text-stone-600 hover:text-orange-600 transition-colors">Delivery</button>
              <button onClick={() => scrollToSection('track')} className="font-bold text-stone-600 hover:text-orange-600 transition-colors">Track Order</button>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2.5 bg-stone-100 hover:bg-orange-50 text-stone-700 hover:text-orange-600 rounded-full transition-colors flex items-center gap-2 px-5"
              >
                <ShoppingCart size={20} />
                <span className="hidden sm:inline font-bold text-sm">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-orange-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md animate-bounce-short">
                    {cartCount}
                  </span>
                )}
              </button>
              <button className="md:hidden p-2 text-stone-600 bg-stone-100 rounded-full" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X size={22} /> : <MenuIcon size={22} />}
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-stone-100 absolute w-full shadow-2xl animate-fade-in-down">
            <div className="px-4 pt-2 pb-6 space-y-2">
              <button onClick={() => scrollToSection('menu')} className="block w-full text-left px-4 py-3 text-base font-bold text-stone-800 hover:bg-orange-50 hover:text-orange-600 rounded-lg">Browse Menu</button>
              <button onClick={() => scrollToSection('delivery-zones')} className="block w-full text-left px-4 py-3 text-base font-bold text-stone-800 hover:bg-orange-50 hover:text-orange-600 rounded-lg">Delivery Zones</button>
              <button onClick={() => scrollToSection('track')} className="block w-full text-left px-4 py-3 text-base font-bold text-stone-800 hover:bg-orange-50 hover:text-orange-600 rounded-lg">Track My Order</button>
            </div>
          </div>
        )}
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="pt-12 pb-20 md:pt-24 md:pb-32 px-4 bg-gradient-to-br from-amber-50 to-orange-50 relative overflow-hidden">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wide mx-auto md:mx-0 animate-fade-in-up">
              <ShieldCheck size={16} className="text-orange-500" />
              <span>Loved by UCC Students</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-stone-900 leading-[1.15] animate-fade-in-up" style={{animationDelay: '100ms'}}>
              Your Favorite Local Meals. <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">Delivered Fast.</span>
            </h2>
            
            <p className="text-lg text-stone-600 md:max-w-md mx-auto md:mx-0 animate-fade-in-up" style={{animationDelay: '200ms'}}>
              Craving home-cooked food? Order your favorite Ghanaian dishes effortlessly. Freshly prepared and delivered hot to your door.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5 justify-center md:justify-start pt-4 animate-fade-in-up" style={{animationDelay: '300ms'}}>
              <div className="flex flex-col gap-3 items-center md:items-start w-full sm:w-auto">
                <button 
                  onClick={() => scrollToSection('menu')}
                  className="px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-extrabold text-lg shadow-[0_8px_20px_rgba(234,88,12,0.3)] transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 w-full"
                >
                  Explore Menu <ArrowRight size={20} />
                </button>
                <span className="text-xs font-bold text-stone-500 flex items-center gap-1 uppercase tracking-wide">
                  <Clock size={14} /> Order easily in under a minute
                </span>
              </div>
            </div>
          </div>
          
          <div className="relative mt-8 md:mt-0 animate-fade-in-up" style={{animationDelay: '200ms'}}>
            <img 
              src="https://images.unsplash.com/photo-1604329760661-e71c0c144ce2?auto=format&fit=crop&w=800&q=80" 
              alt="Delicious Jollof" 
              className="relative z-10 w-full h-[300px] md:h-[500px] object-cover rounded-3xl shadow-xl border-4 border-white"
              onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/800x550/ffedd5/ea580c?text=Taste+N+Tell+Food' }}
            />
            <div className="absolute -bottom-6 -left-4 md:bottom-8 md:-left-8 bg-white p-4 rounded-2xl shadow-xl z-20 flex items-center gap-4 border border-stone-100">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle size={20} />
              </div>
              <div>
                <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Quality Assured</p>
                <p className="font-extrabold text-stone-800 text-sm">Prepared Fresh Daily</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- MENU SECTION --- */}
      <section id="menu" className="py-20 bg-white px-4 relative scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="text-3xl md:text-4xl font-extrabold text-stone-900 mb-3">Our Menu</h3>
            <p className="text-stone-600">Browse categories and add items to your cart, or click 'Order Instantly' to buy right away.</p>
          </div>

          <div className="flex overflow-x-auto pb-4 mb-8 gap-2 hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0 md:justify-center">
            {MENU_CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm transition-all ${
                  activeCategory === category 
                    ? 'bg-stone-900 text-white shadow-md' 
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMenu.map(item => (
              <div key={item.id} className={`bg-white rounded-2xl border ${item.available ? 'border-stone-200 hover:shadow-xl hover:border-orange-200' : 'border-stone-100 opacity-75'} shadow-sm transition-all duration-300 overflow-hidden flex flex-col relative`}>
                <div className="relative h-48 overflow-hidden bg-stone-100">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    loading="lazy"
                    className={`w-full h-full object-cover transition-transform duration-500 ${item.available ? 'hover:scale-105' : 'grayscale'}`}
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x400/ffedd5/ea580c?text=Item+Image' }}
                  />
                  {!item.available && (
                    <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center backdrop-blur-[2px]">
                       <span className="bg-stone-900 text-white font-bold px-4 py-1.5 rounded-full uppercase text-sm tracking-wide shadow-lg">Sold Out</span>
                    </div>
                  )}
                  {item.popular && item.available && (
                    <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                      <Star size={10} className="fill-white" /> Popular
                    </div>
                  )}
                  <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur px-3 py-1 rounded-lg shadow-sm">
                    <span className="text-base font-black text-stone-900">GHS {item.price.toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-grow">
                  <h4 className="text-lg font-bold text-stone-900 leading-tight mb-2">{item.name}</h4>
                  <p className="text-stone-500 text-sm mb-5 flex-grow leading-relaxed">{item.description}</p>
                  
                  <div className="flex gap-2 mt-auto">
                    <button 
                      onClick={() => addToCart(item)}
                      disabled={!item.available}
                      className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5
                        ${item.available 
                          ? 'bg-stone-100 hover:bg-stone-200 text-stone-800 active:scale-95' 
                          : 'bg-stone-50 text-stone-400 cursor-not-allowed'}`}
                    >
                      <Plus size={16} /> Add to Cart
                    </button>
                    
                    <button 
                      onClick={() => handleQuickOrder(item)}
                      disabled={!item.available}
                      className={`flex-[1.5] py-3 text-sm font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5
                        ${item.available 
                          ? 'bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-md active:scale-95' 
                          : 'bg-stone-100 text-stone-400 cursor-not-allowed'}`}
                    >
                      Order Instantly <MessageCircle size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- DELIVERY ZONES SECTION --- */}
      <section id="delivery-zones" className="py-16 bg-stone-50 px-4 border-y border-stone-200">
         <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-extrabold text-stone-900 mb-2">Campus Delivery Zones</h3>
            <p className="text-stone-600 mb-8 text-sm">We deliver fresh food quickly to the following locations and their surroundings.</p>
            
            <div className="flex flex-wrap justify-center gap-3">
              {DELIVERY_ZONES.map((zone, i) => (
                <div key={i} className="bg-white border border-stone-200 px-4 py-2 rounded-full text-sm font-bold text-stone-700 shadow-sm flex items-center gap-2">
                  <MapPin size={14} className="text-orange-500"/> {zone}
                </div>
              ))}
            </div>
            <p className="text-xs text-stone-400 mt-6 font-medium uppercase tracking-wide">*Delivery fees vary by exact location, calculated on WhatsApp.</p>
         </div>
      </section>

      {/* --- ORDER TRACKING (MOCK) --- */}
      <section id="track" className="py-20 bg-white px-4">
        <div className="max-w-2xl mx-auto bg-stone-50 rounded-3xl p-8 shadow-inner border border-stone-200 text-center">
          <div className="w-12 h-12 bg-white text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-stone-100">
            <Search size={24} />
          </div>
          <h3 className="text-2xl font-extrabold text-stone-900 mb-2">Track Order Status</h3>
          <p className="text-stone-600 text-sm mb-6">Enter your phone number below for real-time updates.</p>
          
          <form onSubmit={handleTrackOrder} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <input 
              type="text" 
              placeholder="054 000 0000" 
              className="flex-grow px-4 py-3 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-center sm:text-left"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
            />
            <button type="submit" className="px-6 py-3 bg-stone-900 text-white font-bold rounded-xl active:scale-95 transition-transform">
              Track
            </button>
          </form>

           {trackingResult && (
            <div className="mt-8 p-5 bg-white border border-orange-100 rounded-2xl shadow-sm text-left">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-stone-900 text-sm">Current Status</h4>
                <span className="px-3 py-1 bg-orange-100 text-orange-700 font-bold text-xs rounded-full flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
                  {trackingResult.status}
                </span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
              <div className="flex justify-between mt-2 text-[10px] font-bold text-stone-400 uppercase">
                <span>Received</span>
                <span className="text-orange-600">Preparing</span>
                <span>En Route</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-stone-950 text-stone-400 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 opacity-80">
             <div className="w-6 h-6 bg-stone-800 text-white rounded flex items-center justify-center font-bold text-xs">T</div>
            <span className="text-stone-300 font-bold text-lg">{SYSTEM_CONFIG.businessName}</span>
          </div>
          <p className="text-xs text-center font-medium">
            © {new Date().getFullYear()} {SYSTEM_CONFIG.businessName}. Designed for fast campus delivery.
          </p>
        </div>
      </footer>

      {/* --- FLOATING WHATSAPP BUTTON --- */}
      <a 
        href={`https://wa.me/${SYSTEM_CONFIG.whatsappNumber}?text=Hello%20${SYSTEM_CONFIG.businessName},%20I%20have%20an%20inquiry.`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          if(!verifyWhatsAppConfig()) e.preventDefault();
        }}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 bg-[#25D366] text-white p-3.5 rounded-full shadow-[0_4px_15px_rgba(37,211,102,0.4)] hover:scale-110 transition-transform z-30"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle size={28} />
      </a>

      {/* --- STICKY MOBILE CART CTA --- */}
      {cartCount > 0 && !isCartOpen && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-3 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-40 flex justify-between items-center pb-safe">
          <div className="pl-2">
            <p className="text-[10px] text-stone-500 font-bold uppercase mb-0.5">Your Order</p>
            <p className="font-extrabold text-stone-900 text-base">{cartCount} Items • GHS {cartTotal.toFixed(2)}</p>
          </div>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="px-6 py-2.5 bg-orange-600 text-white font-extrabold text-sm rounded-xl shadow-md active:scale-95 transition-transform"
          >
            View Order
          </button>
        </div>
      )}

      {/* --- CART / CHECKOUT DRAWER OVERLAY --- */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div 
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsCartOpen(false)}
          ></div>
          
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
            
            <div className="flex items-center justify-between p-5 border-b border-stone-100 bg-white z-10">
              <h2 className="text-lg font-extrabold text-stone-900 flex items-center gap-2">
                {checkoutStep === 1 ? 'Review Order' : 'Delivery Details'}
              </h2>
              <button 
                onClick={() => { setIsCartOpen(false); setCheckoutStep(1); }} 
                className="p-1.5 bg-stone-100 text-stone-600 hover:text-stone-900 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 bg-stone-50">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-stone-500 space-y-4 px-6 text-center">
                  <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-2">
                    <Utensils size={32} className="text-orange-500" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-900">Your cart is feeling light</h3>
                  <p className="text-sm font-medium">Looks like you haven't added any meals yet. Let's find you something delicious!</p>
                  <button 
                    onClick={() => { setIsCartOpen(false); scrollToSection('menu'); }}
                    className="mt-4 px-6 py-3 bg-stone-900 text-white font-bold rounded-xl active:scale-95 transition-transform"
                  >
                    Browse Menu
                  </button>
                </div>
              ) : checkoutStep === 1 ? (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-3 bg-white p-3 rounded-xl shadow-sm border border-stone-100">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-16 h-16 object-cover rounded-lg" 
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100/ffedd5/ea580c?text=Item' }}
                      />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-stone-900 text-sm leading-snug">{item.name}</h4>
                          <p className="text-orange-600 font-extrabold text-xs mt-0.5">GHS {(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-1 mt-2 w-fit bg-stone-50 rounded-md border border-stone-200">
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 flex items-center justify-center text-stone-600 active:bg-stone-200 rounded-l-md"><Minus size={12} /></button>
                          <span className="font-bold text-xs w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center text-stone-600 active:bg-stone-200 rounded-r-md"><Plus size={12} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-4 bg-white p-4 rounded-xl border border-stone-100 shadow-sm space-y-2">
                    <div className="flex justify-between text-stone-600 text-xs font-bold">
                      <span>Subtotal</span>
                      <span>GHS {cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-stone-500 text-xs font-medium">
                      <span>Delivery</span>
                      <span>TBD on WhatsApp</span>
                    </div>
                    <div className="pt-2 border-t border-stone-100 flex justify-between items-center mt-2">
                      <span className="font-bold text-stone-900 text-sm">Total</span>
                      <span className="font-black text-xl text-stone-900">GHS {cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <form id="checkout-form" onSubmit={handleCheckout} className="space-y-4 bg-white p-5 rounded-xl border border-stone-100 shadow-sm">
                  
                  {Object.keys(formErrors).length > 0 && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-bold flex items-start gap-2 mb-2">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0"/> 
                      <span>Please fill out all required fields to continue.</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wide">Full Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      placeholder="e.g. Kwame Mensah"
                      className={`w-full px-3 py-2.5 bg-stone-50 border ${formErrors.name ? 'border-red-400 bg-red-50' : 'border-stone-200'} rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm`}
                      value={customerDetails.name}
                      onChange={e => { setCustomerDetails({...customerDetails, name: e.target.value}); setFormErrors({...formErrors, name: null}); }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wide">WhatsApp Phone <span className="text-red-500">*</span></label>
                    <input 
                      type="tel" 
                      placeholder="e.g. 054 123 4567"
                      className={`w-full px-3 py-2.5 bg-stone-50 border ${formErrors.phone ? 'border-red-400 bg-red-50' : 'border-stone-200'} rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm`}
                      value={customerDetails.phone}
                      onChange={e => { setCustomerDetails({...customerDetails, phone: e.target.value}); setFormErrors({...formErrors, phone: null}); }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wide">Delivery Area/Hall <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      placeholder="e.g. Valco Hall, Room 12"
                      className={`w-full px-3 py-2.5 bg-stone-50 border ${formErrors.location ? 'border-red-400 bg-red-50' : 'border-stone-200'} rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm`}
                      value={customerDetails.location}
                      onChange={e => { setCustomerDetails({...customerDetails, location: e.target.value}); setFormErrors({...formErrors, location: null}); }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wide">Notes <span className="text-stone-400 font-normal">(Optional)</span></label>
                    <textarea 
                      placeholder="Extra shito, allergies..."
                      rows="2"
                      className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none resize-none text-sm"
                      value={customerDetails.notes}
                      onChange={e => setCustomerDetails({...customerDetails, notes: e.target.value})}
                    ></textarea>
                  </div>
                </form>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-5 bg-white border-t border-stone-100 shadow-[0_-5px_15px_rgba(0,0,0,0.03)] pb-safe relative z-10">
                {checkoutStep === 1 ? (
                  <button 
                    onClick={() => setCheckoutStep(2)}
                    className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-base rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Continue to Delivery Info <ArrowRight size={18} />
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setCheckoutStep(1)}
                      className="px-4 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-colors active:scale-95"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button 
                      type="submit"
                      form="checkout-form"
                      className="flex-1 py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-base rounded-xl shadow-md shadow-green-200/50 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      Complete Order on WhatsApp <MessageCircle size={18} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        :root { --sat-bottom: env(safe-area-inset-bottom); }
        .pb-safe { padding-bottom: max(1rem, var(--sat-bottom)); }
        
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-3px) scale(1.1); }
        }
        
        .animate-slide-in-right { animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; opacity: 0; }
        .animate-fade-in-down { animation: fade-in-down 0.3s ease-out forwards; }
        .animate-bounce-short { animation: bounce-short 2s ease-in-out infinite; }
        
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}