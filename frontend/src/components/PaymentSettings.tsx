import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Loader2, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { userApi } from '../lib/api';

// Initialize Stripe with the publishable key from environment variables
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export function PaymentSettings() {
    const [loading, setLoading] = useState(true);
    const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
    const [cardDetails, setCardDetails] = useState<{ brand: string; last4: string; exp_month: number; exp_year: number } | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [clientSecret, setClientSecret] = useState<string | null>(null);

    const fetchStatus = async () => {
        setLoading(true);
        try {
            const response = await userApi.getPaymentStatus();
            if (response.success && response.data) {
                setHasPaymentMethod(response.data.has_payment_method);
                setCardDetails(response.data.card);
            }
        } catch (error) {
            console.error('Failed to fetch payment status', error);
            toast.error('Failed to load payment settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const handleStartSetup = async () => {
        setLoading(true);
        try {
            const response = await userApi.createSetupIntent();
            if (response.success && response.data) {
                setClientSecret(response.data.client_secret);
                setShowAddForm(true);
            } else {
                toast.error(response.message || 'Failed to initialize payment setup');
            }
        } catch (error) {
            console.error('Setup intent error', error);
            toast.error('Could not start payment setup');
        } finally {
            setLoading(false);
        }
    };

    const handleSetupComplete = () => {
        setShowAddForm(false);
        setClientSecret(null);
        fetchStatus();
        toast.success('Payment method saved successfully');
    };

    if (loading && !showAddForm) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    Payment Methods
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    Manage your payment details for ticket purchases and passes.
                </p>
            </div>

            <div className="p-6">
                {!showAddForm ? (
                    <div>
                        {hasPaymentMethod && cardDetails ? (
                            <div className="mb-6">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-8 bg-white rounded border border-gray-200 flex items-center justify-center font-bold text-gray-600 text-xs uppercase">
                                            {cardDetails.brand}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">•••• •••• •••• {cardDetails.last4}</div>
                                            <div className="text-sm text-gray-500">Expires {cardDetails.exp_month}/{cardDetails.exp_year}</div>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> Default
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300 mb-6">
                                <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                                    <CreditCard className="w-6 h-6 text-gray-400" />
                                </div>
                                <h3 className="text-gray-900 font-medium mb-1">No payment method</h3>
                                <p className="text-gray-500 text-sm">Add a card to purchase tickets.</p>
                            </div>
                        )}

                        <button
                            onClick={handleStartSetup}
                            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
                        >
                            {hasPaymentMethod ? 'Update Payment Method' : 'Add Payment Method'}
                        </button>
                    </div>
                ) : (
                    <div>
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-medium text-gray-900">Enter Card Details</h3>
                            <button
                                onClick={() => setShowAddForm(false)}
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                Cancel
                            </button>
                        </div>
                        {clientSecret && (
                            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                                <SetupForm onSuccess={handleSetupComplete} />
                            </Elements>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function SetupForm({ onSuccess }: { onSuccess: () => void }) {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setProcessing(true);
        setError(null);

        const { error: submitError } = await elements.submit();
        if (submitError) {
            setError(submitError.message || 'Validation failed');
            setProcessing(false);
            return;
        }

        try {
            const result = await stripe.confirmSetup({
                elements,
                confirmParams: {
                    return_url: window.location.href, // Not used for simple card setup usually, but required parameter
                },
                redirect: 'if_required',
            });

            if (result.error) {
                setError(result.error.message || 'Setup failed');
            } else if (result.setupIntent && result.setupIntent.status === 'succeeded') {
                const paymentMethodId = result.setupIntent.payment_method;
                if (typeof paymentMethodId === 'string') {
                    const attachResponse = await userApi.attachPaymentMethod(paymentMethodId);
                    if (attachResponse.success) {
                        onSuccess();
                    } else {
                        setError(attachResponse.message || 'Failed to save payment method');
                    }
                } else {
                    // Should not happen for card setup
                    setError('Invalid payment method ID received');
                }
            }
        } catch (err) {
            console.error(err);
            setError('An unexpected error occurred');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="mb-6">
                <PaymentElement />
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || processing}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
                {processing ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                    </>
                ) : (
                    'Save Payment Method'
                )}
            </button>
        </form>
    );
}
