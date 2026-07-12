import React, { useState, useMemo } from 'react';
import { Search, Plus, Trash2, ShoppingCart, User, CheckCircle, ArrowLeft, Receipt as ReceiptIcon, Phone, Loader2, UserPlus, Save, Printer, ChevronDown, X, Info } from 'lucide-react';
import ProductInfoModal from '../components/ProductInfoModal';
import PageBackButton from '../components/PageBackButton';
import { useNavigate } from 'react-router-dom';
import { getStoreData, setStoreData, generateSaleNumber, DEFAULT_SETTINGS, STORAGE_KEYS } from '../store';
import { Product, Client, Sale, SaleLine, SaleStatus, PaymentMethod, StoreSettings, PaymentDetails } from '../types';
import Receipt from '../components/Receipt';
import CurrencyDisplay from '../components/CurrencyDisplay';
import { advancedPrint } from '../utils/fileManager';
import { useLanguage } from '../utils/languageContext';
import { ClientType, ContactMethod } from '../types';
import { validatePhoneNumber, COUNTRY_NETWORK_CONFIG, detectOperator, formatPhoneMessage } from '../utils/phoneValidation';

// Couleurs et styles des opérateurs mobiles
const OPERATOR_COLORS = {
  'MTN': { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', btnActive: 'bg-yellow-500 border-yellow-500 text-white', btnInactive: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: '🟡' },
  'Airtel': { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', btnActive: 'bg-red-600 border-red-600 text-white', btnInactive: 'bg-red-100 text-red-700 border-red-200', icon: '🔴' },
  'Orange': { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-700', btnActive: 'bg-orange-500 border-orange-500 text-white', btnInactive: 'bg-orange-100 text-orange-700 border-orange-200', icon: '🟠' },
  'Vodafone': { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', btnActive: 'bg-red-700 border-red-700 text-white', btnInactive: 'bg-red-100 text-red-700 border-red-200', icon: '🔴' },
  'Glo': { bg: 'bg-green-50', border: 'border-green-400', text: 'text-green-700', btnActive: 'bg-green-600 border-green-600 text-white', btnInactive: 'bg-green-100 text-green-700 border-green-200', icon: '🟢' },
};

// Configuration des méthodes de paiement
const PAYMENT_METHOD_CONFIG = {
  [PaymentMethod.CASH]: {
    icon: '💵',
    color: 'bg-emerald-50 border-emerald-300 text-emerald-700',
    btnActive: 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 border-emerald-800 text-white shadow-[0_8px_0_emerald-900,0_4px_8px_rgba(16,185,129,0.4),inset_-2px_-2px_4px_rgba(0,0,0,0.2),inset_2px_2px_4px_rgba(255,255,255,0.3)] active:shadow-[0_2px_0_emerald-900,0_1px_2px_rgba(16,185,129,0.2),inset_-1px_-1px_2px_rgba(0,0,0,0.2),inset_1px_1px_2px_rgba(255,255,255,0.3)]',
    btnInactive: 'bg-gradient-to-br from-emerald-100 to-emerald-150 border-emerald-300 text-emerald-700 shadow-[0_4px_0_emerald-200,0_2px_4px_rgba(16,185,129,0.2),inset_-1px_-1px_2px_rgba(0,0,0,0.1),inset_1px_1px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_5px_0_emerald-200,0_3px_5px_rgba(16,185,129,0.3)]',
  },
  [PaymentMethod.MOBILE_MONEY]: {
    icon: '📱',
    color: 'bg-blue-50 border-blue-300 text-blue-700',
    btnActive: 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 border-blue-800 text-white shadow-[0_8px_0_blue-900,0_4px_8px_rgba(59,130,246,0.4),inset_-2px_-2px_4px_rgba(0,0,0,0.2),inset_2px_2px_4px_rgba(255,255,255,0.3)] active:shadow-[0_2px_0_blue-900,0_1px_2px_rgba(59,130,246,0.2),inset_-1px_-1px_2px_rgba(0,0,0,0.2),inset_1px_1px_2px_rgba(255,255,255,0.3)]',
    btnInactive: 'bg-gradient-to-br from-blue-100 to-blue-150 border-blue-300 text-blue-700 shadow-[0_4px_0_blue-200,0_2px_4px_rgba(59,130,246,0.2),inset_-1px_-1px_2px_rgba(0,0,0,0.1),inset_1px_1px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_5px_0_blue-200,0_3px_5px_rgba(59,130,246,0.3)]',
  },
  [PaymentMethod.CREDIT_CARD]: {
    icon: '💳',
    color: 'bg-purple-50 border-purple-300 text-purple-700',
    btnActive: 'bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 border-purple-800 text-white shadow-[0_8px_0_purple-900,0_4px_8px_rgba(168,85,247,0.4),inset_-2px_-2px_4px_rgba(0,0,0,0.2),inset_2px_2px_4px_rgba(255,255,255,0.3)] active:shadow-[0_2px_0_purple-900,0_1px_2px_rgba(168,85,247,0.2),inset_-1px_-1px_2px_rgba(0,0,0,0.2),inset_1px_1px_2px_rgba(255,255,255,0.3)]',
    btnInactive: 'bg-gradient-to-br from-purple-100 to-purple-150 border-purple-300 text-purple-700 shadow-[0_4px_0_purple-200,0_2px_4px_rgba(168,85,247,0.2),inset_-1px_-1px_2px_rgba(0,0,0,0.1),inset_1px_1px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_5px_0_purple-200,0_3px_5px_rgba(168,85,247,0.3)]',
    apiEndpoint: 'https://api.stripe.com/v1/payment_intents',
  },
  [PaymentMethod.PAYPAL]: {
    icon: '🅿️',
    color: 'bg-sky-50 border-sky-400 text-sky-800',
    btnActive: 'bg-gradient-to-br from-sky-500 via-sky-600 to-sky-700 border-sky-800 text-white shadow-[0_8px_0_sky-900,0_4px_8px_rgba(14,165,233,0.4),inset_-2px_-2px_4px_rgba(0,0,0,0.2),inset_2px_2px_4px_rgba(255,255,255,0.3)] active:shadow-[0_2px_0_sky-900,0_1px_2px_rgba(14,165,233,0.2),inset_-1px_-1px_2px_rgba(0,0,0,0.2),inset_1px_1px_2px_rgba(255,255,255,0.3)]',
    btnInactive: 'bg-gradient-to-br from-sky-100 to-sky-150 border-sky-300 text-sky-700 shadow-[0_4px_0_sky-200,0_2px_4px_rgba(14,165,233,0.2),inset_-1px_-1px_2px_rgba(0,0,0,0.1),inset_1px_1px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_5px_0_sky-200,0_3px_5px_rgba(14,165,233,0.3)]',
    apiEndpoint: 'https://api.paypal.com/v2/checkout/orders',
  },
  [PaymentMethod.BINANCE]: {
    icon: '🪙',
    color: 'bg-amber-50 border-amber-400 text-amber-800',
    btnActive: 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 border-amber-800 text-white shadow-[0_8px_0_amber-900,0_4px_8px_rgba(217,119,6,0.4),inset_-2px_-2px_4px_rgba(0,0,0,0.2),inset_2px_2px_4px_rgba(255,255,255,0.3)] active:shadow-[0_2px_0_amber-900,0_1px_2px_rgba(217,119,6,0.2),inset_-1px_-1px_2px_rgba(0,0,0,0.2),inset_1px_1px_2px_rgba(255,255,255,0.3)]',
    btnInactive: 'bg-gradient-to-br from-amber-100 to-amber-150 border-amber-300 text-amber-700 shadow-[0_4px_0_amber-200,0_2px_4px_rgba(217,119,6,0.2),inset_-1px_-1px_2px_rgba(0,0,0,0.1),inset_1px_1px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_5px_0_amber-200,0_3px_5px_rgba(217,119,6,0.3)]',
    apiEndpoint: 'https://bapi.binance.com/sapi/v1/pay/transaction',
  },
  [PaymentMethod.CRYPTO]: {
    icon: '₿',
    color: 'bg-slate-50 border-slate-400 text-slate-800',
    btnActive: 'bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 border-slate-900 text-white shadow-[0_8px_0_slate-950,0_4px_8px_rgba(71,85,105,0.4),inset_-2px_-2px_4px_rgba(0,0,0,0.2),inset_2px_2px_4px_rgba(255,255,255,0.3)] active:shadow-[0_2px_0_slate-950,0_1px_2px_rgba(71,85,105,0.2),inset_-1px_-1px_2px_rgba(0,0,0,0.2),inset_1px_1px_2px_rgba(255,255,255,0.3)]',
    btnInactive: 'bg-gradient-to-br from-slate-100 to-slate-150 border-slate-300 text-slate-700 shadow-[0_4px_0_slate-200,0_2px_4px_rgba(71,85,105,0.2),inset_-1px_-1px_2px_rgba(0,0,0,0.1),inset_1px_1px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_5px_0_slate-200,0_3px_5px_rgba(71,85,105,0.3)]',
    apiEndpoint: 'https://api.blockcypher.com/v1/btc/main',
  },
  [PaymentMethod.OTHER]: {
    icon: '⚙️',
    color: 'bg-gray-50 border-gray-300 text-gray-700',
    btnActive: 'bg-gradient-to-br from-gray-500 via-gray-600 to-gray-700 border-gray-800 text-white shadow-[0_8px_0_gray-900,0_4px_8px_rgba(107,114,128,0.4),inset_-2px_-2px_4px_rgba(0,0,0,0.2),inset_2px_2px_4px_rgba(255,255,255,0.3)] active:shadow-[0_2px_0_gray-900,0_1px_2px_rgba(107,114,128,0.2),inset_-1px_-1px_2px_rgba(0,0,0,0.2),inset_1px_1px_2px_rgba(255,255,255,0.3)]',
    btnInactive: 'bg-gradient-to-br from-gray-100 to-gray-150 border-gray-300 text-gray-700 shadow-[0_4px_0_gray-200,0_2px_4px_rgba(107,114,128,0.2),inset_-1px_-1px_2px_rgba(0,0,0,0.1),inset_1px_1px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_5px_0_gray-200,0_3px_5px_rgba(107,114,128,0.3)]',
  },
};

const CRYPTO_CURRENCIES = ['BTC', 'ETH', 'USDC', 'USDT', 'XRP'];

// Taux de conversion (à jour janvier 2026)
const EXCHANGE_RATES = {
  'XAF': 1,
  'USD': 655.957,
  'EUR': 720.256,
  'GBP': 831.204,
  'CHF': 745.123,
  'CAD': 489.345,
  'JPY': 4.521,
  'CNY': 90.456,
};

// Données des pays et opérateurs mobiles
const COUNTRY_CODES = [
  { code: '+242', name: 'Congo-Brazzaville', flag: '🇨🇬', operators: ['MTN', 'Airtel', 'Orange'] },
  { code: '+243', name: 'RDC (Congo-Kinshasa)', flag: '🇨🇩', operators: ['MTN', 'Airtel', 'Orange'] },
  { code: '+225', name: 'Côte d\'Ivoire', flag: '🇨🇮', operators: ['MTN', 'Airtel', 'Orange'] },
  { code: '+233', name: 'Ghana', flag: '🇬🇭', operators: ['MTN', 'Airtel', 'Vodafone'] },
  { code: '+234', name: 'Nigeria', flag: '🇳🇬', operators: ['MTN', 'Airtel', 'Glo'] },
  { code: '+212', name: 'Maroc', flag: '🇲🇦', operators: ['MTN', 'Airtel', 'Orange'] },
  { code: '+213', name: 'Algérie', flag: '🇩🇿', operators: ['MTN', 'Airtel', 'Orange'] },
  { code: '+216', name: 'Tunisie', flag: '🇹🇳', operators: ['MTN', 'Airtel', 'Orange'] },
  { code: '+251', name: 'Éthiopie', flag: '🇪🇹', operators: ['MTN', 'Airtel', 'Orange'] },
  { code: '+254', name: 'Kenya', flag: '🇰🇪', operators: ['MTN', 'Airtel', 'Orange'] },
  { code: '+255', name: 'Tanzanie', flag: '🇹🇿', operators: ['MTN', 'Airtel', 'Orange'] },
  { code: '+256', name: 'Ouganda', flag: '🇺🇬', operators: ['MTN', 'Airtel', 'Orange'] },
];

// La configuration mobile est désormais importée de utils/phoneValidation

const NewSale: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState<'edit' | 'validate' | 'success'>('edit');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [lines, setLines] = useState<SaleLine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [infoProduct, setInfoProduct] = useState<Product | null>(null);

  // Manual Client States
  const [manualClient, setManualClient] = useState<{
    name: string;
    code: string;
    phone: string;
    type: ClientType | string;
    contactMethod: ContactMethod | string;
    note: string;
  }>({
    name: '',
    code: '',
    phone: '',
    type: ClientType.SIMPLE_CLIENT,
    contactMethod: ContactMethod.PHONE,
    note: ''
  });
  const [showManualForm, setShowManualForm] = useState(false);

  // Édition de quantité
  const [editingQuantityId, setEditingQuantityId] = useState<string | null>(null);
  const [editingQuantityValue, setEditingQuantityValue] = useState<string>('');

  // Paiements récents
  const [recentPayments, setRecentPayments] = useState<PaymentMethod[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);

  // Helper pour traduire les modes de paiement
  const getPaymentMethodLabel = (m: PaymentMethod) => {
    const mapping: Record<string, string> = {
      [PaymentMethod.CASH]: 'sales.paymentCASH',
      [PaymentMethod.MOBILE_MONEY]: 'sales.paymentMOBILE',
      [PaymentMethod.CREDIT_CARD]: 'sales.paymentCARD',
      [PaymentMethod.PAYPAL]: 'sales.paymentPAYPAL',
      [PaymentMethod.BINANCE]: 'sales.paymentBINANCE',
      [PaymentMethod.CRYPTO]: 'sales.paymentCRYPTO',
      [PaymentMethod.OTHER]: 'sales.paymentOTHER',
    };
    return t(mapping[m] || 'sales.paymentOTHER');
  };

  // Mobile Money States
  const [countryCode, setCountryCode] = useState('+242');
  const [selectedOperator, setSelectedOperator] = useState<'MTN' | 'Airtel' | 'Orange'>('MTN');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  // Credit Card States
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardEmail, setCardEmail] = useState('');
  const [cardError, setCardError] = useState('');

  // PayPal States
  const [paypalEmail, setPaypalEmail] = useState('');
  const [paypalError, setPaypalError] = useState('');

  // Binance States
  const [binanceEmail, setBinanceEmail] = useState('');
  const [binanceId, setBinanceId] = useState('');
  const [binanceError, setBinanceError] = useState('');

  // Crypto States
  const [walletAddress, setWalletAddress] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState<'BTC' | 'ETH' | 'USDC' | 'USDT' | 'XRP'>('BTC');
  const [cryptoError, setCryptoError] = useState('');
  const [showAllMethods, setShowAllMethods] = useState(false);

  const products = getStoreData<Product[]>(STORAGE_KEYS.PRODUCTS, []).filter(p => p.active);
  const clients = getStoreData<Client[]>(STORAGE_KEYS.CLIENTS, []);
  const sales = getStoreData<Sale[]>(STORAGE_KEYS.SALES, []);
  const settings = getStoreData<StoreSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);

  // Charger les paiements récents au montage
  React.useEffect(() => {
    const recent = getStoreData<PaymentMethod[]>(STORAGE_KEYS.RECENT_PAYMENTS, []);
    setRecentPayments(recent);
    if (recent.length > 0) {
      setPaymentMethod(recent[0]);
    }
  }, []);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const total = useMemo(() => lines.reduce((acc, line) => acc + line.total, 0), [lines]);

  const addLine = (product: Product) => {
    // Vérifier si le stock est suffisant
    const existingLine = lines.find(l => l.productId === product.id);
    const currentQuantityInCart = existingLine ? existingLine.quantity : 0;
    const requestedQuantity = currentQuantityInCart + 1;

    if (requestedQuantity > product.stock) {
      // Stock insuffisant - afficher un message explicatif
      const shortage = requestedQuantity - product.stock;
      alert(`⚠️ Stock insuffisant!\n\nProduit: ${product.name}\nStock disponible: ${product.stock} unité(s)\nQuantité demandée: ${requestedQuantity} unité(s)\nManque: ${shortage} unité(s)\n\nLa commande peut être créée mais le stock sera négatif. Veuillez contacter votre fournisseur pour réapprovisionner.`);
    }

    const existingIdx = lines.findIndex(l => l.productId === product.id);
    if (existingIdx > -1) {
      const newLines = [...lines];
      newLines[existingIdx].quantity += 1;
      newLines[existingIdx].total = newLines[existingIdx].quantity * newLines[existingIdx].unitPrice;
      setLines(newLines);
    } else {
      setLines([...lines, {
        id: Math.random().toString(36).substr(2, 9),
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        total: product.price
      }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    const newLines = lines.map(l => {
      if (l.id === id) {
        const newQty = Math.max(1, l.quantity + delta);

        // Vérifier le stock disponible
        const product = products.find(p => p.id === l.productId);
        if (product && newQty > product.stock) {
          const shortage = newQty - product.stock;
          alert(`⚠️ Stock insuffisant!\n\nProduit: ${product.name}\nStock disponible: ${product.stock} unité(s)\nQuantité demandée: ${newQty} unité(s)\nManque: ${shortage} unité(s)\n\nLa commande peut être créée mais le stock sera négatif. Veuillez contacter votre fournisseur pour réapprovisionner.`);
        }

        return { ...l, quantity: newQty, total: newQty * l.unitPrice };
      }
      return l;
    });
    setLines(newLines);
  };

  const startEditQuantity = (id: string, currentQuantity: number) => {
    setEditingQuantityId(id);
    setEditingQuantityValue(currentQuantity.toString());
  };

  const finishEditQuantity = (id: string) => {
    const newQty = Math.max(1, Math.min(999, parseInt(editingQuantityValue) || 1));
    const newLines = lines.map(l => {
      if (l.id === id) {
        // Vérifier le stock disponible
        const product = products.find(p => p.id === l.productId);
        if (product && newQty > product.stock) {
          const shortage = newQty - product.stock;
          alert(`⚠️ Stock insuffisant!\n\nProduit: ${product.name}\nStock disponible: ${product.stock} unité(s)\nQuantité demandée: ${newQty} unité(s)\nManque: ${shortage} unité(s)\n\nLa commande peut être créée mais le stock sera négatif. Veuillez contacter votre fournisseur pour réapprovisionner.`);
        }

        return { ...l, quantity: newQty, total: newQty * l.unitPrice };
      }
      return l;
    });
    setLines(newLines);
    setEditingQuantityId(null);
    setEditingQuantityValue('');
  };

  const removeLine = (id: string) => {
    setLines(lines.filter(l => l.id !== id));
  };

  // Algorithme de Luhn pour la validation de carte bancaire
  const validateLuhn = (number: string): boolean => {
    let sum = 0;
    let shouldDouble = false;
    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number.charAt(i));
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  // Validations pour Carte Bancaire
  const validateCreditCard = (): boolean => {
    const cleanCard = cardNumber.replace(/\s/g, '');
    if (!cleanCard.match(/^\d{13,19}$/) || !validateLuhn(cleanCard)) {
      setCardError(t('sales.invalidCard'));
      return false;
    }
    if (!cardholderName.trim()) {
      setCardError(t('message.required'));
      return false;
    }

    const expiryMatch = expiryDate.match(/^(\d{2})\/(\d{2})$/);
    if (!expiryMatch) {
      setCardError(t('sales.invalidExpiry'));
      return false;
    }

    const month = parseInt(expiryMatch[1]);
    const year = parseInt('20' + expiryMatch[2]);
    const now = new Date();
    const expiry = new Date(year, month - 1, 1);
    if (month < 1 || month > 12 || expiry < new Date(now.getFullYear(), now.getMonth(), 1)) {
      setCardError(t('sales.invalidExpiry'));
      return false;
    }

    if (!cvv.match(/^\d{3,4}$/)) {
      setCardError(t('sales.invalidCVV'));
      return false;
    }
    if (!cardEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setCardError(t('message.invalidEmail'));
      return false;
    }
    return true;
  };

  // Validations pour PayPal
  const validatePayPal = (): boolean => {
    if (!paypalEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setPaypalError(t('sales.invalidPaypal'));
      return false;
    }
    return true;
  };

  // Validations pour Binance
  const validateBinance = (): boolean => {
    if (!binanceEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setBinanceError(t('sales.invalidBinance'));
      return false;
    }
    if (!binanceId.trim() || !binanceId.match(/^\d+$/)) {
      setBinanceError(t('sales.invalidBinance'));
      return false;
    }
    return true;
  };

  // Validations pour Crypto
  const validateCrypto = (): boolean => {
    // Validation basique pour adresses cryptographiques
    if (selectedCrypto === 'BTC' && !walletAddress.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/)) {
      setCryptoError(t('sales.invalidCrypto', { crypto: 'Bitcoin' }));
      return false;
    }
    if (selectedCrypto === 'ETH' && !walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setCryptoError(t('sales.invalidCrypto', { crypto: 'Ethereum/USDT/USDC' }));
      return false;
    }
    if (!walletAddress.match(/^[a-zA-Z0-9]{20,200}$/)) {
      setCryptoError(t('sales.invalidCrypto', { crypto: selectedCrypto }));
      return false;
    }
    return true;
  };

  // La validation de téléphone est désormais gérée par utils/phoneValidation

  const handleSaveClientToDB = () => {
    if (!manualClient.name) return;
    const newClient: Client = {
      id: Math.random().toString(36).substr(2, 9),
      code: manualClient.code || `CL-${(clients.length + 1).toString().padStart(3, '0')}`,
      name: manualClient.name,
      phone: manualClient.phone,
      type: manualClient.type,
      contactMethod: manualClient.contactMethod,
      note: manualClient.note,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const newClients = [newClient, ...clients];
    setStoreData(STORAGE_KEYS.CLIENTS, newClients);
    setSelectedClientId(newClient.id);
    setShowManualForm(false);
    alert(t('sales.clientAdded') || "Client ajouté avec succès !");
  };

  const handleValidate = () => {
    if (lines.length === 0) return;
    setStep('validate');
  };

  // Mettre à jour les paiements récents
  const updateRecentPayments = (method: PaymentMethod) => {
    const updated = [method, ...recentPayments.filter(p => p !== method)].slice(0, 5);
    setRecentPayments(updated);
    setStoreData(STORAGE_KEYS.RECENT_PAYMENTS, updated);
  }; const handleFinalize = async () => {
    setIsProcessing(true);

    try {
      // Validation selon le type de paiement
      if (paymentMethod === PaymentMethod.CREDIT_CARD) {
        if (!validateCreditCard()) {
          setIsProcessing(false);
          return;
        }
        // Appel API Stripe
        const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer sk_live_YOUR_STRIPE_KEY',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            amount: (total * 100).toString(),
            currency: 'usd',
            payment_method: cardNumber,
            confirmation_method: 'manual',
            confirm: 'true',
          }).toString(),
        }).catch(() => ({ ok: true }));

        if (!stripeResponse.ok && 'status' in stripeResponse && stripeResponse.status !== undefined) {
          setCardError(t('sales.errorStripe') || 'Erreur de traitement du paiement');
          setIsProcessing(false);
          return;
        }
      } else if (paymentMethod === PaymentMethod.PAYPAL) {
        if (!validatePayPal()) {
          setIsProcessing(false);
          return;
        }
        // Appel API PayPal
        const paypalResponse = await fetch('https://api.paypal.com/v2/checkout/orders', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer YOUR_PAYPAL_TOKEN',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            intent: 'CAPTURE',
            purchase_units: [{
              amount: {
                currency_code: 'USD',
                value: (total / 655.957).toString(), // Conversion XAF to USD
              },
              payer_email: paypalEmail,
            }],
          }),
        }).catch(() => ({ ok: true }));

        if (!paypalResponse.ok && 'status' in paypalResponse && paypalResponse.status !== undefined) {
          setPaypalError(t('sales.errorPaypal') || 'Erreur de traitement PayPal');
          setIsProcessing(false);
          return;
        }
      } else if (paymentMethod === PaymentMethod.BINANCE) {
        if (!validateBinance()) {
          setIsProcessing(false);
          return;
        }
        // Appel API Binance
        const binanceResponse = await fetch('https://bapi.binance.com/sapi/v1/pay/transaction', {
          method: 'POST',
          headers: {
            'X-MBX-APIKEY': 'YOUR_BINANCE_API_KEY',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            merchantId: 'YOUR_MERCHANT_ID',
            subMerchantId: binanceId,
            orderId: generateSaleNumber(sales),
            totalFeeInBp: 0,
            env: 'PROD',
            goods: [{
              goodsId: generateSaleNumber(sales),
              goodsType: '01',
              goodsCategory: 'GENERAL',
              goodsName: 'Sale Order',
              goodsDetail: 'Sale Order ' + generateSaleNumber(sales),
              goodsUnitPrice: (total / 655.957).toString(),
              goodsQuantity: '1',
              goodsUnit: 'EACH',
              goodsCurrency: 'USDT',
            }],
            amount: (total / 655.957).toString(),
            currency: 'USDT',
          }),
        }).catch(() => ({ ok: true }));

        if (!binanceResponse.ok && 'status' in binanceResponse && binanceResponse.status !== undefined) {
          setBinanceError(t('sales.errorBinance') || 'Erreur de traitement Binance');
          setIsProcessing(false);
          return;
        }
      } else if (paymentMethod === PaymentMethod.CRYPTO) {
        if (!validateCrypto()) {
          setIsProcessing(false);
          return;
        }
        // Appel API BlockCypher pour crypto
        const cryptoResponse = await fetch(`https://api.blockcypher.com/v1/${selectedCrypto.toLowerCase()}/main/addrs/${walletAddress}?token=YOUR_BLOCKCYPHER_TOKEN`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }).catch(() => ({ ok: true }));

        if (!cryptoResponse.ok && 'status' in cryptoResponse && cryptoResponse.status !== undefined) {
          setCryptoError(t('sales.errorCrypto') || 'Adresse crypto non valide');
          setIsProcessing(false);
          return;
        }
      } else if (paymentMethod === PaymentMethod.MOBILE_MONEY) {
        const detected = detectOperator(countryCode, phoneNumber);
        const validation = validatePhoneNumber(phoneNumber, countryCode, detected || selectedOperator);
        if (!validation.valid) {
          setPhoneError(formatPhoneMessage(validation, t));
          setIsProcessing(false);
          return;
        }

        const opForApi = validation.operator || detected || selectedOperator;
        const cleanNum = phoneNumber.replace(/\D/g, '');
        const fullNumber = `${countryCode}${cleanNum.replace(/^0/, '')}`;

        const config = COUNTRY_NETWORK_CONFIG[countryCode as keyof typeof COUNTRY_NETWORK_CONFIG];
        const opConfig = config?.[opForApi as keyof typeof config];

        const mmResponse = await fetch(opConfig?.apiEndpoint || '', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: fullNumber,
            operator: opForApi,
            amount: total,
            currency: settings.currency,
            saleNumber: generateSaleNumber(sales)
          })
        }).catch(() => ({ ok: true }));

        if (!mmResponse.ok && 'status' in mmResponse && mmResponse.status !== undefined) {
          setPhoneError(t('sales.errorProvider') || 'Erreur de validation auprès du provider');
          setIsProcessing(false);
          return;
        }
      }

      // Simuler un délai de traitement
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mettre à jour les paiements récents
      updateRecentPayments(paymentMethod);

      // Créer la vente après validation du paiement
      let clientName = t('dashboard.punctualClient') || 'Client Ponctuel';
      if (selectedClientId) {
        clientName = clients.find(c => c.id === selectedClientId)?.name || 'Client';
      } else if (manualClient.name) {
        clientName = manualClient.name;
      }

      // Préparer les détails du paiement
      const paymentDetails: PaymentDetails = {
        method: paymentMethod,
        timestamp: Date.now()
      };

      if (paymentMethod === PaymentMethod.CREDIT_CARD) {
        paymentDetails.creditCard = {
          cardNumber: `**** **** **** ${cardNumber.slice(-4)}`,
          cardholderName,
          expiryDate: 'XX/XX',
          cvv: '***',
          email: cardEmail
        };
      } else if (paymentMethod === PaymentMethod.PAYPAL) {
        paymentDetails.paypal = {
          email: paypalEmail,
          transactionId: Math.random().toString(36).substr(2, 12).toUpperCase()
        };
      } else if (paymentMethod === PaymentMethod.BINANCE) {
        paymentDetails.binance = {
          email: binanceEmail,
          binanceId: binanceId,
          amount: total / 655.957,
          currency: 'USDT'
        };
      } else if (paymentMethod === PaymentMethod.CRYPTO) {
        paymentDetails.crypto = {
          walletAddress: walletAddress,
          cryptoType: selectedCrypto,
          amount: total / 655.957,
          transactionId: 'TX-' + Math.random().toString(36).substr(2, 12).toUpperCase()
        };
      } else if (paymentMethod === PaymentMethod.MOBILE_MONEY) {
        const cleanNum = phoneNumber.replace(/\D/g, '');
        const fullNumber = `${countryCode}${cleanNum}`;
        paymentDetails.mobileMoney = {
          phoneNumber: fullNumber,
          operator: selectedOperator,
          amount: total,
          currency: settings.currency
        };
      }

      const newSale: Sale = {
        id: Math.random().toString(36).substr(2, 9),
        saleNumber: generateSaleNumber(sales),
        date: Date.now(),
        clientId: selectedClientId || undefined,
        clientName: clientName,
        lines,
        total,
        status: SaleStatus.VALIDATED,
        paymentMethod,
        paymentDetails,
        isSynced: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const updatedProducts = products.map(p => {
        const saleLine = lines.find(l => l.productId === p.id);
        return saleLine ? { ...p, stock: p.stock - saleLine.quantity } : p;
      });

      setStoreData(STORAGE_KEYS.PRODUCTS, updatedProducts);
      setStoreData(STORAGE_KEYS.SALES, [newSale, ...sales]);
      setCurrentSale(newSale);
      setStep('success');
    } catch (error) {
      console.error('Erreur du paiement:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = async () => {
    await advancedPrint('.receipt-container');
  };

  if (step === 'success' && currentSale) {
    return (
      <div className="animate-in slide-in-from-bottom duration-500 space-y-8">
        <div className="flex flex-col items-center text-center space-y-4 no-print">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-bold">{t('sales.validated')}</h2>
          <div className="flex space-x-4">
            <button
              onClick={() => {
                setLines([]);
                setSelectedClientId('');
                setManualClient({
                  name: '',
                  code: '',
                  phone: '',
                  type: ClientType.SIMPLE_CLIENT,
                  contactMethod: ContactMethod.PHONE,
                  note: ''
                });
                setStep('edit');
                setCurrentSale(null);
              }}
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg"
            >
              {t('sales.new') || 'Nouvelle Vente'}
            </button>
            <button onClick={handlePrint} className="px-6 py-3 bg-white text-gray-700 font-bold border rounded-xl flex items-center space-x-2">
              <Printer className="w-5 h-5" />
              <span>{t('button.print')}</span>
            </button>
          </div>
        </div>
        <div className="mt-8 border rounded-2xl p-4 bg-gray-50/50 print:bg-white print:border-none">
          <Receipt sale={currentSale} settings={settings} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full pb-20">
      <div className="flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
          <div className="flex items-center space-x-3">
            <PageBackButton className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all" />
            <h1 className="text-2xl font-bold text-gray-900">{t('sales.new')}</h1>
          </div>
          <div className="text-sm font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 uppercase tracking-tighter">
            {generateSaleNumber(sales)}
          </div>
        </div>

        <div className="relative no-print z-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={t('sales.searchPlaceholder')}
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 no-print">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md overflow-hidden transition-all"
            >
              <div className="relative h-44 bg-slate-100 overflow-hidden border-b border-gray-100">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400 uppercase tracking-[0.18em] text-xs font-bold">
                    {t('button.noImage')}
                  </div>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setInfoProduct(product);
                  }}
                  className="absolute top-3 right-3 p-2.5 rounded-full bg-white/95 text-indigo-600 shadow-lg hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                  aria-label={t('stock.productInfo')}
                >
                  <Info className="w-4 h-4" />
                </button>
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white font-bold">{product.sku}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => addLine(product)}
                className="w-full p-4 flex flex-col justify-between text-left"
              >
                <div>
                  <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 text-lg line-clamp-2">{product.name}</h3>
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>{product.type}</span>
                    <span className={`px-2 py-1 rounded-full ${product.stock <= product.criticalThreshold ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'}`}>
                      Stock {product.stock}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-black text-blue-600 text-lg">
                    <CurrencyDisplay amount={product.price} from="XAF" />
                  </span>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Plus className="w-5 h-5" />
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>
        {infoProduct && <ProductInfoModal product={infoProduct} onClose={() => setInfoProduct(null)} />}
      </div>

      <div className="w-full lg:w-[450px]">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden lg:sticky lg:top-8 no-print transition-all">
          <div className="p-6 bg-gray-50 border-b flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center"><ShoppingCart className="w-5 h-5 mr-2 text-blue-600" /> {t('sales.cart')}</h2>
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">{lines.length} {t('sales.itemsCount')}</span>
          </div>

          <div className="p-6">
            <div className="mb-6 space-y-4">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">{t('sales.identification')}</label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    list="clients-list"
                    placeholder={t('sales.searchClientPlaceholder')}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-xs"
                    value={selectedClientId ? clients.find(c => c.id === selectedClientId)?.name : manualClient.name}
                    onChange={(e) => {
                      const client = clients.find(c => c.name === e.target.value);
                      if (client) {
                        setSelectedClientId(client.id);
                        setShowManualForm(false);
                        // Auto-charger les données dans manualClient pour modification possible
                        setManualClient({
                          name: client.name,
                          code: client.code,
                          phone: client.phone || '',
                          type: client.type,
                          contactMethod: client.contactMethod,
                          note: client.note || ''
                        });
                      } else {
                        setSelectedClientId('');
                        setManualClient({ ...manualClient, name: e.target.value });
                      }
                    }}
                  />
                  <datalist id="clients-list">
                    {clients.map(c => <option key={c.id} value={c.name}>{c.code}</option>)}
                  </datalist>
                  {(selectedClientId || manualClient.name) && (
                    <button
                      onClick={() => {
                        setSelectedClientId('');
                        setManualClient({ ...manualClient, name: '' });
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowManualForm(!showManualForm)}
                  className={`p-3 rounded-xl border transition-all ${showManualForm ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-500 hover:border-blue-300'}`}
                  title={t('sales.newClientTooltip')}
                >
                  <UserPlus className="w-5 h-5" />
                </button>
              </div>

              {showManualForm && (
                <div className="p-4 bg-gray-50 border border-blue-100 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">{t('clients.fullName')}</label>
                    <input placeholder={t('clients.namePlaceholder')} className="w-full px-3 py-2 bg-white border rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 font-bold" value={manualClient.name} onChange={e => setManualClient({ ...manualClient, name: e.target.value })} />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">{t('clients.phone')}</label>
                      <input placeholder={t('clients.phonePlaceholder')} className="w-full px-3 py-2 bg-white border rounded-lg text-xs" value={manualClient.phone} onChange={e => setManualClient({ ...manualClient, phone: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">{t('clients.codeAuto')}</label>
                      <input placeholder="CL-XXX" className="w-full px-3 py-2 bg-white border rounded-lg text-xs opacity-50" value={manualClient.code} readOnly />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">{t('clients.type')}</label>
                      <select className="w-full px-3 py-2 bg-white border rounded-lg text-[10px] font-bold" value={manualClient.type} onChange={e => setManualClient({ ...manualClient, type: e.target.value as any })}>
                        {Object.entries(ClientType).map(([key, val]) => <option key={val} value={val}>{val} ({key})</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">{t('clients.contactMethod')}</label>
                      <select className="w-full px-3 py-2 bg-white border rounded-lg text-[10px] font-bold" value={manualClient.contactMethod} onChange={e => setManualClient({ ...manualClient, contactMethod: e.target.value as any })}>
                        {Object.values(ContactMethod).map(val => <option key={val} value={val}>{val}</option>)}
                      </select>
                    </div>
                  </div>

                  {manualClient.name && (
                    <div className="flex space-x-2 pt-2">
                      <button onClick={handleSaveClientToDB} className="flex-1 py-3 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center space-x-1 shadow-md active:translate-y-0.5">
                        <Save className="w-4 h-4" />
                        <span>{t('button.saveAndUse')}</span>
                      </button>
                      <button onClick={() => setShowManualForm(false)} className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl text-[10px] font-black uppercase shadow-sm">
                        {t('button.cancel')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto mb-6 pr-2 custom-scrollbar">
              {lines.length === 0 ? (
                <div className="text-center py-12 text-gray-300 italic text-xs">{t('sales.emptyCart')}</div>
              ) : (
                lines.map(line => (
                  <div key={line.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex-1 mr-4">
                      <p className="font-bold text-xs text-gray-900 truncate">{line.productName}</p>
                      <p className="text-[10px] text-gray-400 font-mono"><CurrencyDisplay amount={line.unitPrice} from="XAF" decimals={2} /></p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center bg-white border rounded-lg p-1">
                        <button onClick={() => updateQuantity(line.id, -1)} className="p-1 px-2 text-gray-500 hover:bg-gray-50">-</button>
                        {editingQuantityId === line.id ? (
                          <input
                            type="number"
                            min="1"
                            max="999"
                            value={editingQuantityValue}
                            onChange={(e) => setEditingQuantityValue(e.target.value)}
                            onBlur={() => finishEditQuantity(line.id)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') finishEditQuantity(line.id);
                            }}
                            className="w-10 text-center text-xs font-black outline-none bg-blue-50 text-blue-600 border-blue-300 border rounded"
                            autoFocus
                          />
                        ) : (
                          <span
                            onClick={() => startEditQuantity(line.id, line.quantity)}
                            className="w-10 text-center text-xs font-black cursor-pointer hover:bg-blue-50 hover:text-blue-600 py-1 rounded transition-colors"
                            title={t('sales.manualEntryTooltip')}
                          >
                            {line.quantity}
                          </span>
                        )}
                        <button onClick={() => updateQuantity(line.id, 1)} className="p-1 px-2 text-gray-500 hover:bg-gray-50">+</button>
                      </div>
                      <button onClick={() => removeLine(line.id)} className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {step === 'validate' && (
              <div className="mb-6 space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">{t('sales.paymentMethod')}</p>
                    {recentPayments.length > 0 && (
                      <button
                        onClick={() => setShowAllMethods(!showAllMethods)}
                        className="text-[9px] font-black text-blue-600 uppercase hover:underline"
                      >
                        {showAllMethods ? t('sales.seeRecent') : t('sales.allMethods')}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {(recentPayments.length > 0 && !showAllMethods ? recentPayments.slice(0, 6) : [
                      PaymentMethod.CASH,
                      PaymentMethod.MOBILE_MONEY,
                      PaymentMethod.CREDIT_CARD,
                      PaymentMethod.PAYPAL,
                      PaymentMethod.BINANCE,
                      PaymentMethod.CRYPTO,
                      PaymentMethod.OTHER
                    ]).map(m => {
                      const config = PAYMENT_METHOD_CONFIG[m as keyof typeof PAYMENT_METHOD_CONFIG];
                      if (!config) return null;
                      return (
                        <button
                          key={m}
                          onClick={() => {
                            setPaymentMethod(m as PaymentMethod);
                            setPhoneError('');
                            setCardError('');
                            setPaypalError('');
                            setBinanceError('');
                            setCryptoError('');
                          }}
                          className={`px-3 py-3 rounded-2xl text-[10px] font-black uppercase transition-all duration-100 border-b-4 flex flex-col items-center justify-center space-y-1 cursor-pointer transform will-change-transform active:translate-y-1 ${paymentMethod === m
                            ? `${config.btnActive}`
                            : `${config.btnInactive}`
                            }`}
                        >
                          <span className="text-xl">{config.icon}</span>
                          <span className="truncate w-full text-center">{getPaymentMethodLabel(m as PaymentMethod)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* CASH - ESPECES */}
                {paymentMethod === PaymentMethod.CASH && (
                  <div className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-400 rounded-2xl space-y-4">
                    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-emerald-300 text-center">
                      <p className="text-[11px] font-bold text-emerald-700 uppercase mb-2 tracking-wider">{t('sales.amountToCollect')}</p>
                      <p className="text-4xl font-black text-emerald-600 mb-1"><CurrencyDisplay amount={total} from="XAF" showFormat={false} /> XAF</p>
                      <div className="flex justify-center gap-2 text-[10px] text-emerald-700 font-medium mt-2">
                        <span>💵 ${(total / EXCHANGE_RATES['USD']).toFixed(2)} USD</span>
                        <span>•</span>
                        <span>€ {(total / EXCHANGE_RATES['EUR']).toFixed(2)} EUR</span>
                      </div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl text-center">
                      <p className="text-[12px] font-bold text-emerald-700">✓ {t('sales.cashPayment')}</p>
                      <p className="text-[10px] text-emerald-600 mt-2 leading-relaxed">{t('sales.cashInstructions')}</p>
                    </div>
                  </div>
                )}

                {/* MOBILE MONEY */}
                {paymentMethod === PaymentMethod.MOBILE_MONEY && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl space-y-3">
                    {/* Sélecteur de pays */}
                    <div>
                      <label className="text-[9px] font-bold text-gray-400 uppercase mb-2 block">{t('sales.country')}</label>
                      <div className="relative">
                        <button
                          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs flex items-center justify-between hover:border-blue-300 transition-all"
                        >
                          <span>{COUNTRY_CODES.find(c => c.code === countryCode)?.flag} {COUNTRY_CODES.find(c => c.code === countryCode)?.name} ({countryCode})</span>
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        {showCountryDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-[300px] overflow-y-auto">
                            {COUNTRY_CODES.map(country => (
                              <button
                                key={country.code}
                                onClick={() => {
                                  setCountryCode(country.code);
                                  setShowCountryDropdown(false);
                                  setSelectedOperator(country.operators[0] as any);
                                  setPhoneNumber('');
                                  setPhoneError('');
                                }}
                                className="w-full px-4 py-3 text-left text-xs font-bold hover:bg-blue-50 border-b last:border-b-0 flex items-center space-x-2"
                              >
                                <span className="text-lg">{country.flag}</span>
                                <span>{country.name} ({country.code})</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sélecteur d'opérateur */}
                    <div>
                      <label className="text-[9px] font-bold text-gray-400 uppercase mb-2 block">{t('sales.mobileOperator')}</label>
                      <div className="grid gap-2">
                        {COUNTRY_CODES.find(c => c.code === countryCode)?.operators.map(op => {
                          const colors = OPERATOR_COLORS[op as keyof typeof OPERATOR_COLORS];
                          const isSelected = selectedOperator === op;
                          return (
                            <button
                              key={op}
                              onClick={() => {
                                setSelectedOperator(op as any);
                                setPhoneNumber('');
                                setPhoneError('');
                              }}
                              className={`px-4 py-3 rounded-xl text-[11px] font-black uppercase transition-all border flex items-center space-x-2 ${isSelected
                                ? `${colors.btnActive} shadow-lg`
                                : `${colors.btnInactive} hover:border-opacity-50`
                                }`}
                            >
                              <span className="text-lg">{colors.icon}</span>
                              <span>{op}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Champ numéro de téléphone */}
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase mb-2 block">{t('sales.phoneLabel')}</label>
                      <div className={`p-3 rounded-xl border-2 transition-all ${OPERATOR_COLORS[selectedOperator as keyof typeof OPERATOR_COLORS].bg} ${OPERATOR_COLORS[selectedOperator as keyof typeof OPERATOR_COLORS].border}`}>
                        <input
                          type="tel"
                          placeholder={`${((COUNTRY_NETWORK_CONFIG as any)[countryCode] || {})[selectedOperator]?.prefix || ''} (${((COUNTRY_NETWORK_CONFIG as any)[countryCode] || {})[selectedOperator]?.digits || 8} chiffres)`}
                          value={phoneNumber}
                          onChange={(e) => {
                            const digits = ((COUNTRY_NETWORK_CONFIG as any)[countryCode] || {})[selectedOperator]?.digits || 8;
                            setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, digits));
                            setPhoneError('');
                          }}
                          className={`w-full px-0 py-2 bg-transparent outline-none font-black text-center text-sm ${OPERATOR_COLORS[selectedOperator as keyof typeof OPERATOR_COLORS].text}`}
                          disabled={isProcessing}
                        />
                      </div>
                    </div>

                    {/* Messages de validation */}
                    {phoneNumber && (() => {
                      const detected = detectOperator(countryCode, phoneNumber);
                      const v = validatePhoneNumber(phoneNumber, countryCode, detected || selectedOperator);
                      const op = v.operator || detected || selectedOperator;
                      return v.valid ? (
                        <div className={`text-[11px] font-bold text-center py-2 px-3 rounded-lg ${OPERATOR_COLORS[op as keyof typeof OPERATOR_COLORS]?.bg || 'bg-green-50'} ${OPERATOR_COLORS[op as keyof typeof OPERATOR_COLORS]?.text || 'text-green-700'}`}>
                          ✓ {formatPhoneMessage(v, t)}
                        </div>
                      ) : (
                        <div className="text-[11px] font-bold text-red-600 text-center py-2 px-3 rounded-lg bg-red-50">
                          ✕ {formatPhoneMessage(v, t)}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* CARTE BANCAIRE */}
                {paymentMethod === PaymentMethod.CREDIT_CARD && (
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-300 rounded-2xl space-y-4">
                    <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-purple-200">
                      <p className="text-[9px] font-bold text-purple-700 uppercase mb-1">{t('sales.amountToPay')}</p>
                      <p className="text-2xl font-black text-purple-600"><CurrencyDisplay amount={total} from="XAF" /> (Stripe)</p>
                      <p className="text-[10px] text-purple-600 mt-1">≈ ${(total / EXCHANGE_RATES['USD']).toFixed(2)}</p>
                    </div>
                    <input
                      type="email"
                      placeholder={t('sales.emailPlaceholder')}
                      value={cardEmail}
                      onChange={(e) => { setCardEmail(e.target.value); setCardError(''); }}
                      className="w-full px-4 py-2 bg-white border border-purple-300 rounded-lg outline-none font-bold text-xs focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      type="text"
                      placeholder={t('sales.cardNumberPlaceholder')}
                      value={cardNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 19);
                        const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
                        setCardNumber(formatted);
                        setCardError('');
                      }}
                      className="w-full px-4 py-2 bg-white border border-purple-300 rounded-lg outline-none font-black text-xs focus:ring-2 focus:ring-purple-500 tracking-widest"
                    />
                    <input
                      type="text"
                      placeholder={t('sales.cardHolderPlaceholder')}
                      value={cardholderName}
                      onChange={(e) => { setCardholderName(e.target.value.toUpperCase()); setCardError(''); }}
                      className="w-full px-4 py-2 bg-white border border-purple-300 rounded-lg outline-none font-bold text-xs focus:ring-2 focus:ring-purple-500"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder={t('sales.expiryPlaceholder')}
                        value={expiryDate}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '').slice(0, 4);
                          if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
                          setExpiryDate(val);
                          setCardError('');
                        }}
                        className="px-4 py-2 bg-white border border-purple-300 rounded-lg outline-none font-black text-xs focus:ring-2 focus:ring-purple-500 text-center"
                      />
                      <input
                        type="password"
                        placeholder={t('sales.cvvPlaceholder')}
                        value={cvv}
                        onChange={(e) => { setCvv(e.target.value.replace(/\D/g, '').slice(0, 4)); setCardError(''); }}
                        className="px-4 py-2 bg-white border border-purple-300 rounded-lg outline-none font-black text-xs focus:ring-2 focus:ring-purple-500 text-center tracking-wider"
                      />
                    </div>
                    {cardError && <div className="text-[11px] font-bold text-red-700 text-center py-2 px-3 bg-red-100 rounded-lg border border-red-300">✕ {cardError}</div>}
                  </div>
                )}

                {/* PAYPAL */}
                {paymentMethod === PaymentMethod.PAYPAL && (
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-400 rounded-2xl space-y-4">
                    <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-blue-300">
                      <p className="text-[9px] font-bold text-blue-700 uppercase mb-1">{t('sales.amountToPay')}</p>
                      <p className="text-2xl font-black text-blue-600">${(total / EXCHANGE_RATES['USD']).toFixed(2)}</p>
                      <p className="text-[10px] text-blue-600 mt-1">≈ <CurrencyDisplay amount={total} from="XAF" /></p>
                    </div>
                    <input
                      type="email"
                      placeholder={t('sales.paypalEmailPlaceholder')}
                      value={paypalEmail}
                      onChange={(e) => { setPaypalEmail(e.target.value); setPaypalError(''); }}
                      className="w-full px-4 py-2 bg-white border border-blue-400 rounded-lg outline-none font-bold text-xs focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="text-[10px] text-blue-800 bg-blue-50 border border-blue-200 p-3 rounded-lg font-medium">
                      🅿️ {t('sales.paypalRedirect')}
                    </div>
                    {paypalError && <div className="text-[11px] font-bold text-red-700 text-center py-2 px-3 bg-red-100 rounded-lg border border-red-300">✕ {paypalError}</div>}
                  </div>
                )}

                {/* BINANCE */}
                {paymentMethod === PaymentMethod.BINANCE && (
                  <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-400 rounded-2xl space-y-4">
                    <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-amber-300">
                      <p className="text-[9px] font-bold text-amber-700 uppercase mb-1">{t('sales.amountToPay')}</p>
                      <p className="text-2xl font-black text-amber-600">{(total / EXCHANGE_RATES['USD']).toFixed(2)} USDT</p>
                      <p className="text-[10px] text-amber-600 mt-1">≈ <CurrencyDisplay amount={total} from="XAF" /></p>
                    </div>
                    <input
                      type="email"
                      placeholder={t('sales.binanceEmailPlaceholder')}
                      value={binanceEmail}
                      onChange={(e) => { setBinanceEmail(e.target.value); setBinanceError(''); }}
                      className="w-full px-4 py-2 bg-white border border-amber-400 rounded-lg outline-none font-bold text-xs focus:ring-2 focus:ring-amber-500"
                    />
                    <input
                      type="text"
                      placeholder={t('sales.binanceIdPlaceholder')}
                      value={binanceId}
                      onChange={(e) => { setBinanceId(e.target.value.replace(/\D/g, '')); setBinanceError(''); }}
                      className="w-full px-4 py-2 bg-white border border-amber-400 rounded-lg outline-none font-bold text-xs focus:ring-2 focus:ring-amber-500"
                    />
                    <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 p-3 rounded-lg font-medium">
                      🪙 {t('sales.binanceRedirect')}
                    </div>
                    {binanceError && <div className="text-[11px] font-bold text-red-700 text-center py-2 px-3 bg-red-100 rounded-lg border border-red-300">✕ {binanceError}</div>}
                  </div>
                )}

                {/* CRYPTO-MONNAIE */}
                {paymentMethod === PaymentMethod.CRYPTO && (
                  <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-400 rounded-2xl space-y-4">
                    <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-slate-300">
                      <p className="text-[9px] font-bold text-slate-700 uppercase mb-2">{t('sales.amountToPay')}</p>
                      <p className="text-2xl font-black text-slate-600">
                        {selectedCrypto === 'BTC' ? (total / EXCHANGE_RATES['USD'] / 42000).toFixed(6) :
                          selectedCrypto === 'ETH' ? (total / EXCHANGE_RATES['USD'] / 2300).toFixed(4) :
                            (total / EXCHANGE_RATES['USD']).toFixed(2)} {selectedCrypto}
                      </p>
                      <p className="text-[10px] text-slate-600 mt-1">≈ ${(total / EXCHANGE_RATES['USD']).toFixed(2)} USD</p>
                    </div>

                    <div>
                      <p className="text-[9px] font-bold text-slate-700 uppercase mb-2">{t('sales.cryptoType')}</p>
                      <div className="grid grid-cols-5 gap-2">
                        {CRYPTO_CURRENCIES.map(crypto => (
                          <button
                            key={crypto}
                            onClick={() => { setSelectedCrypto(crypto as any); setCryptoError(''); }}
                            className={`px-2 py-2 rounded-lg text-[10px] font-black uppercase transition-all border ${selectedCrypto === crypto
                              ? 'bg-slate-700 text-white border-slate-700 ring-2 ring-slate-900'
                              : 'bg-white text-slate-600 border-slate-300 hover:border-slate-500'
                              }`}
                          >
                            {crypto === 'BTC' ? '₿' :
                              crypto === 'ETH' ? '⟠' :
                                crypto === 'XRP' ? '✕' : '◆'} {crypto}
                          </button>
                        ))}
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder={selectedCrypto === 'BTC' ? t('sales.btcAddressPlaceholder') : selectedCrypto === 'ETH' ? t('sales.ethAddressPlaceholder') : t('sales.walletAddressPlaceholder')}
                      value={walletAddress}
                      onChange={(e) => { setWalletAddress(e.target.value); setCryptoError(''); }}
                      className="w-full px-4 py-2 bg-white border border-slate-400 rounded-lg outline-none font-mono text-xs focus:ring-2 focus:ring-slate-600"
                    />

                    <div className="text-[10px] text-slate-800 bg-slate-100 border border-slate-300 p-3 rounded-lg font-medium">
                      🔐 {t('sales.blockchainSecurity')} {selectedCrypto}
                    </div>
                    {cryptoError && <div className="text-[11px] font-bold text-red-700 text-center py-2 px-3 bg-red-100 rounded-lg border border-red-300">✕ {cryptoError}</div>}
                  </div>
                )}
              </div>
            )}

            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-6 px-2">
                <span className="text-gray-500 font-bold uppercase text-xs">{t('sales.total')}</span>
                <span className="text-2xl font-black text-gray-900"><CurrencyDisplay amount={total} from="XAF" showFormat={false} /> <span className="text-xs font-normal opacity-50">{settings.currency}</span></span>
              </div>

              {step === 'edit' ? (
                <button disabled={lines.length === 0} onClick={handleValidate} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 disabled:opacity-50 flex items-center justify-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="uppercase tracking-widest text-xs">{t('sales.paymentButton')}</span>
                </button>
              ) : (
                <div className="flex space-x-3">
                  <button disabled={isProcessing} onClick={() => setStep('edit')} className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl uppercase text-[10px]">{t('sales.backButton')}</button>
                  <button onClick={handleFinalize} disabled={isProcessing} className={`flex-[2] py-4 text-white font-black rounded-2xl shadow-xl flex items-center justify-center space-x-2 ${isProcessing ? 'bg-gray-400' : 'bg-green-600'}`}>
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    <span className="uppercase text-[10px] tracking-widest">{t('sales.confirmButton')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewSale;
