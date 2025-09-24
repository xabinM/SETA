import {useState, useEffect} from 'react';
import logoSrc from '@/assets/seta.png';
import './CustomToast.css';

interface CustomToastProps {
    message: string;
    description?: string;
    duration?: number;
    onClose?: () => void;
}

export default function CustomToast({
                                        message,
                                        description,
                                        duration = 2500,
                                        onClose,
                                    }: CustomToastProps) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            if (onClose) onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    if (!visible) return null;

    return (
        <div className="custom-toast">
            <div className="toast-content">
        <span className="toast-logo">
          <img src={logoSrc} alt="SETA" draggable={false}/>
        </span>
                <div className="toast-texts">
                    <div className="toast-title">{message}</div>
                    {description && <div className="toast-description">{description}</div>}
                </div>
            </div>
        </div>
    );
}
