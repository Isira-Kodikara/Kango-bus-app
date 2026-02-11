import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
    dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((type: Toast['type'], message: string, duration = 4000) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const toast: Toast = { id, type, message, duration };

        setToasts(prev => [...prev, toast]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }
    }, []);

    const dismiss = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const value: ToastContextType = {
        toasts,
        success: (msg, dur) => addToast('success', msg, dur),
        error: (msg, dur) => addToast('error', msg, dur ?? 6000),
        warning: (msg, dur) => addToast('warning', msg, dur),
        info: (msg, dur) => addToast('info', msg, dur),
        dismiss,
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={dismiss} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

// Toast Container — renders all active toasts
function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </div>
    );
}

// Individual Toast
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
    const styles: Record<Toast['type'], { bg: string; border: string; icon: string; text: string }> = {
        success: { bg: 'bg-green-50', border: 'border-green-400', icon: '✅', text: 'text-green-800' },
        error: { bg: 'bg-red-50', border: 'border-red-400', icon: '❌', text: 'text-red-800' },
        warning: { bg: 'bg-amber-50', border: 'border-amber-400', icon: '⚠️', text: 'text-amber-800' },
        info: { bg: 'bg-blue-50', border: 'border-blue-400', icon: 'ℹ️', text: 'text-blue-800' },
    };

    const s = styles[toast.type];

    return (
        <div
            className={`${s.bg} ${s.border} ${s.text} border-l-4 rounded-xl shadow-lg px-4 py-3 flex items-start gap-3 pointer-events-auto animate-slide-in-right`}
            role="alert"
        >
            <span className="text-lg flex-shrink-0 mt-0.5">{s.icon}</span>
            <p className="text-sm font-medium flex-1 leading-snug">{toast.message}</p>
            <button
                onClick={() => onDismiss(toast.id)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none flex-shrink-0"
            >
                ×
            </button>
        </div>
    );
}
