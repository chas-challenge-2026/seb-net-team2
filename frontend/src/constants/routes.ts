import {
    House,
    CreditCard,
    ScrollText,
    UserRound,
    LogOut,
    type LucideIcon,
} from 'lucide-react';

export const navigationLinks: {
    to: string;
    labelKey: string;
    icon: LucideIcon;
}[] = [
        { to: '/dashboard', labelKey: 'navigation.dashboard', icon: House },
        { to: '/ny-betalning', labelKey: 'navigation.newPayment', icon: CreditCard },
        { to: '/granskningslogg', labelKey: 'navigation.auditLog', icon: ScrollText },
        { to: '/profil', labelKey: 'navigation.profile', icon: UserRound },
        { to: '/logout', labelKey: 'navigation.logout', icon: LogOut },
    ];