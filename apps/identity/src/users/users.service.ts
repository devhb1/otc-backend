import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@app/database';

/**
 * UsersService - User Management Business Logic
 * 
 * Handles user-related operations:
 * - Get user profile
 * - Update user information
 * - Role management
 * - Account status management
 */
@Injectable()
export class UsersService {
    constructor(private readonly db: DatabaseService) { }

    /**
     * Get dashboard data for home page
     * 
     * Returns comprehensive information including:
     * - User profile with wallets
     * - Platform information
     * - Quick statistics
     * - Suggested next steps
     */
    async getDashboard(userId: string) {
        // Get user with wallets
        const user = await this.db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                role: true,
                status: true,
                kycStatus: true,
                referralCode: true,
                referredBy: true,
                isVerified: true,
                createdAt: true,
                wallets: {
                    select: {
                        currency: true,
                        balance: true,
                        lockedBalance: true,
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Platform information
        const platform = {
            name: 'OTC Platform',
            tagline: 'Secure Peer-to-Peer Cryptocurrency Trading',
            description: 'Trade cryptocurrencies directly with other users in a secure, escrow-protected environment. Built for trust, transparency, and efficiency.',
            features: [
                {
                    title: 'Escrow Protection',
                    description: 'All trades are secured with automated escrow to protect both buyers and sellers',
                    icon: '🔒',
                },
                {
                    title: 'Multi-Currency Support',
                    description: 'Trade MAAL, USDT, USD and other popular cryptocurrencies',
                    icon: '💰',
                },
                {
                    title: 'KYC Verification',
                    description: 'Verified users for safer and more trustworthy trading experience',
                    icon: '✅',
                },
                {
                    title: 'Real-Time Trading',
                    description: 'Instant order matching and real-time price updates',
                    icon: '⚡',
                },
                {
                    title: 'Low Fees',
                    description: 'Competitive trading fees with transparent pricing',
                    icon: '💸',
                },
                {
                    title: 'Referral Rewards',
                    description: 'Earn rewards by inviting friends to the platform',
                    icon: '🎁',
                },
            ],
            howItWorks: [
                {
                    step: 1,
                    title: 'Complete KYC',
                    description: 'Verify your identity to unlock full trading capabilities',
                },
                {
                    step: 2,
                    title: 'Fund Your Wallet',
                    description: 'Deposit funds into your wallet to start trading',
                },
                {
                    step: 3,
                    title: 'Create or Browse Orders',
                    description: 'Post your own orders or browse existing ones from other traders',
                },
                {
                    step: 4,
                    title: 'Trade Securely',
                    description: 'Complete trades with escrow protection and instant settlement',
                },
            ],
        };

        // Quick statistics
        const quickStats = {
            totalWallets: user.wallets.length,
            totalBalance: user.wallets.reduce((sum, w) => sum + parseFloat(w.balance.toString()), 0).toFixed(2),
            kycCompleted: user.kycStatus === 'VERIFIED' as any,
            accountAge: Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)), // days
        };

        // Next steps based on user status
        const nextSteps: Array<{
            title: string;
            description: string;
            action: string;
            priority: 'high' | 'medium' | 'low';
        }> = [];
        
        if (user.kycStatus === 'PENDING' || user.kycStatus === 'REJECTED') {
            nextSteps.push({
                title: 'Complete KYC Verification',
                description: 'Verify your identity to unlock full trading features',
                action: 'Start KYC',
                priority: 'high',
            });
        }

        const hasZeroBalance = user.wallets.every(w => parseFloat(w.balance.toString()) === 0);
        if (hasZeroBalance && user.kycStatus === 'VERIFIED' as any) {
            nextSteps.push({
                title: 'Fund Your Wallet',
                description: 'Deposit funds to start trading',
                action: 'Deposit Funds',
                priority: 'medium',
            });
        }

        if (user.kycStatus === 'VERIFIED' as any && !hasZeroBalance) {
            nextSteps.push({
                title: 'Start Trading',
                description: 'Browse orders or create your own trade',
                action: 'View Orders',
                priority: 'high',
            });
        }

        nextSteps.push({
            title: 'Invite Friends',
            description: `Use your referral code: ${user.referralCode}`,
            action: 'Share Code',
            priority: 'low',
        });

        return {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                status: user.status,
                kycStatus: user.kycStatus,
                referralCode: user.referralCode,
                isVerified: user.isVerified,
                wallets: user.wallets,
            },
            platform,
            quickStats,
            nextSteps,
        };
    }

    /**
     * Get user by ID
     */
    async findById(id: string) {
        const user = await this.db.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                role: true,
                status: true,
                kycStatus: true,
                referralCode: true,
                referredBy: true,
                createdAt: true,
                updatedAt: true,
                // Include wallet balances
                wallets: {
                    select: {
                        currency: true,
                        balance: true,
                        lockedBalance: true,
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    /**
     * Get user by email
     */
    async findByEmail(email: string) {
        return this.db.user.findUnique({
            where: { email },
        });
    }

    /**
     * Switch user role (BUYER <-> SELLER)
     * Users can switch between buyer and seller roles
     */
    async switchRole(userId: string, newRole: 'BUYER' | 'SELLER') {
        const user = await this.db.user.update({
            where: { id: userId },
            data: { role: newRole },
            select: {
                id: true,
                email: true,
                role: true,
            },
        });

        return user;
    }
}
