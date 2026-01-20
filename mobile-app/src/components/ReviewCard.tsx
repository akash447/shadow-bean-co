import React from 'react';
import { View, Text, StyleSheet, Image, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/Colors';

interface ReviewCardProps {
    rating: number;
    comment: string;
    authorName: string;
    createdAt?: string;
    compact?: boolean;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
    rating,
    comment,
    authorName,
    createdAt,
    compact = false,
}) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const renderStars = () => {
        return Array.from({ length: 5 }).map((_, index) => (
            <Ionicons
                key={index}
                name={index < rating ? 'star' : 'star-outline'}
                size={compact ? 14 : 18}
                color={index < rating ? '#FFD700' : colors.border}
                style={{ marginRight: 2 }}
            />
        ));
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    if (compact) {
        return (
            <View style={[styles.compactCard, { backgroundColor: colors.card }]}>
                <View style={styles.starsRow}>{renderStars()}</View>
                <Text
                    style={[styles.compactComment, { color: colors.text }]}
                    numberOfLines={3}
                >
                    "{comment}"
                </Text>
                <Text style={[styles.compactAuthor, { color: colors.oliveGreen }]}>
                    — {authorName}
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {authorName.charAt(0).toUpperCase()}
                    </Text>
                </View>
                <View style={styles.headerInfo}>
                    <Text style={[styles.authorName, { color: colors.text }]}>
                        {authorName}
                    </Text>
                    {createdAt && (
                        <Text style={[styles.date, { color: colors.textSecondary }]}>
                            {formatDate(createdAt)}
                        </Text>
                    )}
                </View>
                <View style={styles.starsRow}>{renderStars()}</View>
            </View>
            <Text style={[styles.comment, { color: colors.textSecondary }]}>
                {comment}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4a5d4a',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    headerInfo: {
        flex: 1,
    },
    authorName: {
        fontSize: 16,
        fontWeight: '600',
    },
    date: {
        fontSize: 12,
        marginTop: 2,
    },
    starsRow: {
        flexDirection: 'row',
    },
    comment: {
        fontSize: 14,
        lineHeight: 22,
    },
    // Compact styles
    compactCard: {
        padding: 16,
        borderRadius: 12,
        width: 260,
        marginRight: 12,
    },
    compactComment: {
        fontSize: 14,
        lineHeight: 20,
        marginVertical: 8,
        fontStyle: 'italic',
    },
    compactAuthor: {
        fontSize: 13,
        fontWeight: '600',
    },
});
