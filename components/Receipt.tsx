
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

  const dateLocale = language === 'fr' ? fr : enUS;
  const formattedDate = format(new Date(sale.date), 'PPpp', { locale: dateLocale });

  const renderPaymentDetails = () => {
    if (!sale.paymentDetails) return null;

    const details = sale.paymentDetails;
    return (
      <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('history.receiptModeDetail')}</h4>
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-gray-500 font-bold uppercase">{t('history.receiptMode')}</span>
            <span className="font-bold text-blue-600">{sale.paymentMethod}</span>
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

          {(details.paypal?.transactionId || details.crypto?.transactionId) && (
            <div className="flex justify-between text-[9px] mt-1 text-gray-400">
              <span>{t('history.receiptTxId')}</span>
              <span className="font-mono">{details.paypal?.transactionId || details.crypto?.transactionId}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-8 shadow-2xl rounded-3xl border border-gray-100 max-w-md mx-auto receipt-container print:shadow-none print:border-none print:p-4 print:max-w-none text-gray-900 overflow-hidden relative">
      {/* Branding Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <CompanyLogo src={profile.logo} fallbackLetter={profile.companyName?.[0] || 'C'} size="lg" />
        </div>
        <h2 className="text-2xl font-black tracking-tight uppercase leading-tight">{profile.companyName}</h2>
        <p className="text-[10px] font-black text-blue-600 tracking-[0.2em] uppercase mt-1">
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
          <p className="text-xs font-black uppercase text-blue-900 tracking-wide">
            {sale.clientName || t('dashboard.punctualClient')}
          </p>
        </div>
      </div>

      {/* Items List */}
      <table className="w-full text-xs mb-8">
        <thead>
          <tr className="border-b-2 border-gray-900 border-dashed">
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
              <td className="py-3 text-right font-black text-blue-900">{line.total.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals & Payment Details */}
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-blue-900 text-white p-4 rounded-2xl shadow-xl shadow-blue-100">
          <span className="text-xs font-black uppercase tracking-widest">{t('history.receiptTotal')}</span>
          <div className="text-right">
            <span className="text-2xl font-black tabular-nums">{sale.total.toLocaleString()}</span>
            <span className="text-[10px] font-bold ml-1 opacity-70 italic">{settings.currency}</span>
          </div>
        </div>

        {renderPaymentDetails()}
      </div>

      {/* Business Coordinates */}
      <div className="mt-12 text-center p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
        <div className="flex flex-col items-center justify-center space-y-1">
          <p className="text-[10px] font-black text-gray-900 uppercase tracking-tighter">{profile.address}</p>
          <div className="flex flex-col items-center space-y-0.5 text-[10px] font-bold text-gray-500">
            {(profile.publicPhones.length ? profile.publicPhones : [profile.publicPhone].filter(Boolean)).map((ph) => (
              <span key={ph}>📞 {ph}</span>
            ))}
            {profile.publicEmail && <span>✉️ {profile.publicEmail}</span>}
          </div>
        </div>
      </div>

      {/* Dynamic Professional Footer */}
      <div className="mt-8 pt-8 border-t border-gray-900 border-dashed">
        <div className="text-center font-black text-[9px] text-gray-900 uppercase tracking-[0.3em] opacity-40">
          {t('history.receiptFooter')}
        </div>
      </div>

      {/* Decorative Branding Element */}
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] select-none pointer-events-none">
        <div className="text-6xl font-black italic -rotate-12 uppercase tracking-tighter">
          {profile.companyName.slice(0, 3)}
        </div>
      </div>
    </div>
  );
};

export default Receipt;
