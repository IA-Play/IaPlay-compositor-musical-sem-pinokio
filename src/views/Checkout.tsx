
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../services/apiClient'; import { getSystemSettings } from '../services/settingsService';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, Lock, ArrowLeft, CreditCard, Loader2, AlertTriangle, Tag, Check } from 'lucide-react';
import { useModal } from '../components/ModalProvider';

export const Checkout: React.FC = () => {
    const { plan } = useParams(); // 'monthly' or 'yearly'
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showAlert } = useModal();
    const settings = getSystemSettings();

    const [loading, setLoading] = useState(false);
    const [coupon, setCoupon] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState<number | null>(null);
    const [couponError, setCouponError] = useState('');

    const rawPrice = plan === 'yearly' ? settings.yearlyPrice : settings.monthlyPrice;
    const priceVal = parseFloat(rawPrice.replace(',', '.'));

    const finalPrice = appliedDiscount
        ? (priceVal * (1 - appliedDiscount / 100)).toFixed(2).replace('.', ',')
        : rawPrice;

    const planName = plan === 'yearly' ? 'Plano Anual (VIP)' : 'Plano Mensal';

    const handleApplyCoupon = async () => {
        setCouponError('');
        if (!coupon) return;

        try {
            const res = (await apiClient.post('api/auth.php?action=validate_coupon', { code: coupon })) as any;
            if (res.error) throw new Error(res.error);
            const data = res.data;
            if (data.success) {
                setAppliedDiscount(data.discount);
            } else {
                setCouponError("Cupom inválido ou expirado.");
                setAppliedDiscount(null);
            }
        } catch (e: any) {
            setCouponError(e.message || "Erro ao validar.");
        }
    };

    const handlePayment = async () => {
        setLoading(true);

        try {
            const res = (await apiClient.post('api/stripe_checkout.php', {
                plan: plan,
                email: user?.email,
                id: user?.id,
                coupon: appliedDiscount ? coupon : null
            })) as any;
            if (res.error) throw new Error(res.error);
            const data = res.data;

            if (data.url) {
                window.location.href = data.url;
            }
        } catch (e: any) {
            await showAlert("Erro ao iniciar pagamento: " + (e.message || "Erro desconhecido") + "\n\nVerifique se a Chave Secreta do Stripe (SK) está configurada no Painel Admin.");
            setLoading(false);
        }
    };

    if (!user) {
        navigate('/login');
        return null;
    }

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col md:flex-row">

            {/* Left: Order Summary */}
            <div className="w-full md:w-1/2 bg-zinc-900 text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-pink-500" />

                <div>
                    <button onClick={() => navigate('/pricing')} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8 text-sm">
                        <ArrowLeft className="w-4 h-4" /> Voltar
                    </button>

                    <div className="flex items-center gap-2 mb-2 text-zinc-400 font-medium">
                        <ShieldCheck className="w-5 h-5 text-green-500" /> Checkout Seguro
                    </div>

                    <h1 className="text-3xl font-bold mb-2">IAPLAY Pro</h1>

                    <div>
                        <div className="text-5xl font-bold text-white mb-1">R$ {finalPrice}</div>
                        <div className="text-zinc-400">Total a pagar hoje</div>
                    </div>
                </div>

                <div className="space-y-4 my-8">
                    <div className="flex justify-between items-center py-4 border-b border-white/10">
                        <span className="text-zinc-300">{planName}</span>
                        <span className="font-bold">R$ {rawPrice}</span>
                    </div>

                    {appliedDiscount && (
                        <div className="flex justify-between items-center py-2 text-green-400 font-bold">
                            <span>Desconto ({appliedDiscount}%)</span>
                            <span>- R$ {(priceVal * (appliedDiscount / 100)).toFixed(2).replace('.', ',')}</span>
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t border-white/10 text-xl font-bold">
                        <span>Total</span>
                        <span>R$ {finalPrice}</span>
                    </div>
                </div>

                <div className="text-xs text-zinc-500">
                    <p className="mb-2">Pagamento processado de forma segura pelo Stripe.</p>
                    <p>© 2024 IAPLAY Inc.</p>
                </div>
            </div>

            {/* Right: Payment Action */}
            <div className="w-full md:w-1/2 bg-white p-8 md:p-12 flex flex-col justify-center items-center">
                <div className="max-w-md mx-auto w-full text-center">
                    <h2 className="text-2xl font-bold mb-6 flex items-center justify-center gap-2">
                        Finalizar Assinatura
                        <Lock className="w-4 h-4 text-zinc-400" />
                    </h2>

                    <p className="text-zinc-500 mb-8">
                        Você será redirecionado para a página segura de pagamento do Stripe. <br />
                        Acesso imediato após a confirmação.
                    </p>

                    {/* Coupon Input */}
                    <div className="mb-6 text-left">
                        <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Tem um cupom?</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Tag className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                                <input
                                    value={coupon}
                                    onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                                    placeholder="CÓDIGO"
                                    className={`w-full pl-9 pr-4 py-3 border rounded-xl text-sm focus:outline-none uppercase font-bold ${appliedDiscount ? 'border-green-500 text-green-600 bg-green-50' : 'border-zinc-200'}`}
                                    disabled={!!appliedDiscount}
                                />
                                {appliedDiscount && <Check className="absolute right-3 top-3 w-4 h-4 text-green-500" />}
                            </div>
                            {!appliedDiscount ? (
                                <button onClick={handleApplyCoupon} className="px-4 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-700">Aplicar</button>
                            ) : (
                                <button onClick={() => { setAppliedDiscount(null); setCoupon(''); }} className="px-4 text-red-500 text-xs hover:underline">Remover</button>
                            )}
                        </div>
                        {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
                    </div>

                    {settings.isStripeTestMode && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-left shadow-sm">
                            <h3 className="text-yellow-700 font-bold text-sm mb-1 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" /> Ambiente de Teste Ativo
                            </h3>
                            <p className="text-xs text-yellow-600 mb-3 leading-relaxed">
                                O sistema está em modo Sandbox. Pagamentos reais não serão processados.
                                Para testar, use os dados abaixo:
                            </p>
                            <div className="bg-white p-3 rounded text-xs font-mono text-zinc-600 border border-yellow-200">
                                Cartão: <strong className="text-black">4242 4242 4242 4242</strong><br />
                                Data: Qualquer futura (ex: 12/30)<br />
                                CVC: Qualquer (ex: 123)
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handlePayment}
                        disabled={loading}
                        className="w-full py-4 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-wait bg-[#635BFF] hover:bg-[#534be0]"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" /> Processando...
                            </>
                        ) : (
                            <>
                                Pagar com Stripe <CreditCard className="w-5 h-5" />
                            </>
                        )}
                    </button>

                    <div className="mt-6 flex justify-center gap-4 opacity-50 grayscale">
                        {/* Stripe Branding Mock */}
                        <div className="h-6 w-10 bg-zinc-200 rounded"></div>
                        <div className="h-6 w-10 bg-zinc-200 rounded"></div>
                        <div className="h-6 w-10 bg-zinc-200 rounded"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
