import React from 'react';
import { Sale, StoreSettings } from '../types';
import { useLanguage } from '../utils/languageContext';
import { resolveCompanyProfile, getBusinessTypeLabel } from '../utils/companyProfile';
import CompanyLogo from './CompanyLogo';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

interface ReceiptProps {
  sale: Sale;
  settings: StoreSettings;
}

const Receipt: React.FC<ReceiptProps> = ({ sale, settings }) => {
  const { t, language } = useLanguage();
  const profile = resolveCompanyProfile(settings);
  const template = settings.receiptTemplate || 'pro_color';

  const dateLocale = language === 'fr' ? fr : enUS;
  const formattedDate = format(new Date(sale.date), 'PPpp', { locale: dateLocale });

  const renderPaymentDetails = (isBW: boolean) => {
    if (!sale.paymentDetails) return null;
    const details = sale.paymentDetails;
    return (
      <div className={`mt-4 pt-4 border-t border-dashed ${isBW ? 'border-black' : 'border-gray-200'}`}>
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('history.receiptModeDetail')}</h4>
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-gray-500 font-bold uppercase">{t('history.receiptMode')}</span>
            <span className={`font-bold ${isBW ? 'text-black' : 'text-primary'}`}>{sale.paymentMethod}</span>
          </div>
          {details.mobileMoney && (
            <>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">{t('history.receiptOperator')}</span>
                <span className="font-mono">{details.mobileMoney.operator}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">{t('history.receiptPhone')}</span>
                <span className="font-mono">{details.mobileMoney.phoneNumber}</span>
              </div>
            </>
          )}
          {details.creditCard && (
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-500">{t('history.receiptCard')}</span>
              <span className="font-mono">{details.creditCard.cardNumber}</span>
            </div>
          )}
          {details.paypal && (
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-500">PayPal</span>
              <span className="font-mono">{details.paypal.email}</span>
            </div>
          )}
          {details.binance && (
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-500">Binance Pay</span>
              <span className="font-mono">{details.binance.binanceId}</span>
            </div>
          )}
          {details.crypto && (
            <>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">{t('history.receiptCrypto')}</span>
                <span className="font-mono text-[9px] truncate max-w-[120px]">{details.crypto.walletAddress}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">Type</span>
                <span className="font-mono">{details.crypto.cryptoType}</span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // 1. MODÈLE THERMIQUE (Optimisé pour imprimantes à rouleau 58mm/80mm)
  if (template === 'thermal_pro') {
    return (
      <div className="w-[80mm] max-w-[80mm] mx-auto p-4 bg-white text-black font-mono text-[10px] space-y-3 leading-tight receipt-container print:p-0 print:w-full">
        {/* Header */}
        <div className="text-center space-y-1">
          {profile.logo && (
            <div className="flex justify-center mb-2">
              <CompanyLogo src={profile.logo} fallbackLetter={profile.companyName?.[0] || 'C'} size="sm" />
            </div>
          )}
          <h2 className="text-sm font-black uppercase tracking-tight">{profile.companyName}</h2>
          {profile.businessType && (
            <p className="text-[8px] uppercase tracking-wider">
              {getBusinessTypeLabel(t, profile.businessType, language) || profile.businessType}
            </p>
          )}
          {profile.address && <p className="text-[8px]">{profile.address}</p>}
          {profile.publicPhone && <p className="text-[8px]">Tél: {profile.publicPhone}</p>}
        </div>

        {/* Separator */}
        <div className="border-t border-dashed border-black my-2"></div>

        {/* Meta Info */}
        <div className="space-y-1 text-[9px]">
          <div className="flex justify-between">
            <span>Ticket:</span>
            <span className="font-bold">{sale.saleNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{formattedDate}</span>
          </div>
          <div className="flex justify-between">
            <span>Client:</span>
            <span className="font-bold uppercase">{sale.clientName || t('dashboard.punctualClient')}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-black my-2"></div>

        {/* Table / Articles */}
        <table className="w-full text-[9px]">
          <thead>
            <tr className="border-b border-dashed border-black">
              <th className="text-left py-1 font-bold">Qté</th>
              <th className="text-left py-1 px-1 font-bold">Article</th>
              <th className="text-right py-1 font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.lines.map((line, idx) => (
              <tr key={idx} className="border-b border-dotted border-gray-200">
                <td className="py-1.5 text-left">{line.quantity}</td>
                <td className="py-1.5 text-left px-1 uppercase truncate max-w-[110px]">{line.productName}</td>
                <td className="py-1.5 text-right font-bold">{line.total.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaux */}
        <div className="border-t border-dashed border-black pt-2 space-y-1">
          <div className="flex justify-between text-xs font-black">
            <span>TOTAL:</span>
            <span>{sale.total.toLocaleString()} {settings.currency}</span>
          </div>
          <div className="flex justify-between text-[9px]">
            <span>Paiement:</span>
            <span className="font-bold">{sale.paymentMethod}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-black my-2"></div>

        {/* Footer */}
        <div className="text-center text-[8px] uppercase tracking-wide space-y-1 opacity-70">
          <p>{t('history.receiptFooter')}</p>
          <p>Merci pour votre visite !</p>
        </div>
      </div>
    );
  }

  // 2. MODÈLE NOIR & BLANC (Optimisé laser/jet d'encre standard, sans fioritures de couleurs)
  if (template === 'pro_bw') {
    return (
      <div className="bg-white p-8 rounded-none border-2 border-black max-w-md mx-auto receipt-container print:border-none print:p-4 text-black overflow-hidden relative font-sans">
        <div className="flex items-center space-x-4 mb-8">
            {profile.logo && (
              <div className="flex-shrink-0">
                <CompanyLogo src={profile.logo} fallbackLetter={profile.companyName?.[0] || 'C'} size="lg" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-black text-black tracking-tight uppercase">
                {profile.companyName}
              </h1>
              {profile.businessType && (
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                  {getBusinessTypeLabel(t, profile.businessType, language) || profile.businessType}
                </p>
              )}
            </div>
          </div>

        <div className="grid grid-cols-2 gap-4 border-y-2 border-black py-4 mb-6">
          <div>
            <p className="text-[9px] font-black text-gray-500 uppercase">{t('history.receiptNumber')}</p>
            <p className="text-xs font-mono font-bold">{sale.saleNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-gray-500 uppercase">{t('history.receiptDate')}</p>
            <p className="text-[10px] font-bold">{formattedDate}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[9px] font-black text-gray-500 uppercase">{t('history.receiptClient')}</p>
            <p className="text-xs font-black uppercase tracking-wide">
              {sale.clientName || t('dashboard.punctualClient')}
            </p>
          </div>
        </div>

        <table className="w-full text-xs mb-6">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="py-2 text-left font-black text-[9px] uppercase">Qté</th>
              <th className="py-2 text-left font-black text-[9px] uppercase px-2">Désignation</th>
              <th className="py-2 text-right font-black text-[9px] uppercase">P.U</th>
              <th className="py-2 text-right font-black text-[9px] uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sale.lines.map((line, idx) => (
              <tr key={idx}>
                <td className="py-2 text-left font-bold">{line.quantity}</td>
                <td className="py-2 text-left px-2 uppercase truncate max-w-[140px]">{line.productName}</td>
                <td className="py-2 text-right font-mono">{line.unitPrice.toLocaleString()}</td>
                <td className="py-2 text-right font-bold">{line.total.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-4">
          <div className="flex justify-between items-center border-2 border-black p-4 bg-gray-50">
            <span className="text-xs font-black uppercase tracking-widest">TOTAL</span>
            <div className="text-right">
              <span className="text-2xl font-black">{sale.total.toLocaleString()}</span>
              <span className="text-[10px] font-bold ml-1">{settings.currency}</span>
            </div>
          </div>
          {renderPaymentDetails(true)}
        </div>

        <div className="mt-8 text-center p-4 bg-gray-50 border border-black space-y-1 text-xs">
          <p className="font-bold">{profile.address}</p>
          {profile.publicPhone && <p>📞 {profile.publicPhone}</p>}
        </div>

        <div className="mt-6 pt-6 border-t border-dashed border-black text-center font-bold text-[9px] uppercase tracking-[0.2em]">
          {t('history.receiptFooter')}
        </div>
      </div>
    );
  }

  // 3. MODÈLE PRO COULEUR (Premium RDS standard)
  return (
    <div className="bg-white p-8 shadow-premium rounded-3xl border border-gray-100 max-w-md mx-auto receipt-container print:shadow-none print:border-none print:p-4 print:max-w-none text-gray-900 overflow-hidden relative font-sans">
      {/* Branding Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <CompanyLogo src={profile.logo} fallbackLetter={profile.companyName?.[0] || 'C'} size="lg" />
        </div>
        <h2 className="text-2xl font-black tracking-tight uppercase leading-tight">{profile.companyName}</h2>
        <p className="text-[10px] font-black text-primary tracking-[0.2em] uppercase mt-1">
          {getBusinessTypeLabel(t, profile.businessType, language) || profile.businessType}
        </p>
      </div>

      {/* Basic Sale Info */}
      <div className="grid grid-cols-2 gap-4 border-y border-dashed border-gray-200 py-4 mb-6">
        <div className="space-y-1">
          <p className="text-[9px] font-black text-gray-400 uppercase">{t('history.receiptNumber')}</p>
          <p className="text-xs font-mono font-bold">{sale.saleNumber}</p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[9px] font-black text-gray-400 uppercase">{t('history.receiptDate')}</p>
          <p className="text-[10px] font-bold leading-none">{formattedDate}</p>
        </div>
        <div className="col-span-2 space-y-1">
          <p className="text-[9px] font-black text-gray-400 uppercase">{t('history.receiptClient')}</p>
          <p className="text-xs font-black uppercase text-primary-700 tracking-wide">
            {sale.clientName || t('dashboard.punctualClient')}
          </p>
        </div>
      </div>

      {/* Items List */}
      <table className="w-full text-xs mb-8">
        <thead>
          <tr className="border-b-2 border-primary border-dashed">
            <th className="py-2 text-left font-black text-[9px] uppercase">{t('history.receiptQty')}</th>
            <th className="py-2 text-left font-black text-[9px] uppercase px-2">{t('history.receiptDesignation')}</th>
            <th className="py-2 text-right font-black text-[9px] uppercase">{t('history.receiptUnitPrice')}</th>
            <th className="py-2 text-right font-black text-[9px] uppercase">{t('history.receiptTotalPrice')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {sale.lines.map((line, idx) => (
            <tr key={idx} className="group italic">
              <td className="py-3 text-left font-bold">{line.quantity}</td>
              <td className="py-3 text-left px-2 font-medium">
                <div className="truncate max-w-[140px] font-bold uppercase tracking-tight">{line.productName}</div>
              </td>
              <td className="py-3 text-right font-mono text-[10px]">{line.unitPrice.toLocaleString()}</td>
              <td className="py-3 text-right font-black text-primary-700">{line.total.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals & Payment Details */}
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-primary text-white p-4 rounded-2xl shadow-premium">
          <span className="text-xs font-black uppercase tracking-widest">{t('history.receiptTotal')}</span>
          <div className="text-right">
            <span className="text-2xl font-black tabular-nums">{sale.total.toLocaleString()}</span>
            <span className="text-[10px] font-bold ml-1 opacity-70 italic">{settings.currency}</span>
          </div>
        </div>

        {renderPaymentDetails(false)}
      </div>

      {/* Business Coordinates */}
      <div className="mt-12 text-center p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
        <div className="flex flex-col items-center justify-center space-y-1">
          {profile.address && <p className="text-[10px] font-black text-gray-900 uppercase tracking-tighter">{profile.address}</p>}
          <div className="flex flex-col items-center space-y-0.5 text-[10px] font-bold text-gray-500">
            {(profile.publicPhones.length ? profile.publicPhones : [profile.publicPhone].filter(Boolean)).map((ph) => (
              <span key={ph}>📞 {ph}</span>
            ))}
            {profile.publicEmail && <span>✉️ {profile.publicEmail}</span>}
          </div>
        </div>
      </div>

      {/* Dynamic Professional Footer */}
      <div className="mt-8 pt-8 border-t border-primary border-dashed">
        <div className="text-center font-black text-[9px] text-gray-900 uppercase tracking-[0.3em] opacity-40">
          {t('history.receiptFooter')}
        </div>
      </div>
    </div>
  );
};

export default Receipt;
