import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
    TextInput,
    useColorScheme,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/Colors';
import { createReview } from '@/src/services/supabase';
import { useAuthStore } from '@/src/stores/authStore';

interface ReviewModalProps {
    visible: boolean;
    onClose: () => void;
    orderId?: string;
    onSuccess?: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
    visible,
    onClose,
    orderId,
    onSuccess,
}) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { user } = useAuthStore();

    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!comment.trim()) {
            Alert.alert('Error', 'Please write a review comment');
            return;
        }

        if (!user?.id) {
            Alert.alert('Error', 'Please login to submit a review');
            return;
        }

        setLoading(true);
        try {
            const { error } = await createReview({
                userId: user.id,
                orderId: orderId || null,
                rating,
                comment: comment.trim(),
            });

            if (error) {
                Alert.alert('Error', error.message);
            } else {
                Alert.alert('Success', 'Thank you for your review!');
                setRating(5);
                setComment('');
                onSuccess?.();
                onClose();
            }
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    const renderStars = () => {
        return (
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable
                        key={star}
                        onPress={() => setRating(star)}
                        style={styles.starButton}
                    >
                        <Ionicons
                            name={star <= rating ? 'star' : 'star-outline'}
                            size={36}
                            color={star <= rating ? '#FFD700' : colors.border}
                        />
                    </Pressable>
                ))}
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </Pressable>
                    <Text style={[styles.title, { color: colors.text }]}>
                        Write a Review
                    </Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Rating */}
                    <View style={styles.ratingSection}>
                        <Text style={[styles.label, { color: colors.text }]}>
                            How would you rate your experience?
                        </Text>
                        {renderStars()}
                        <Text style={[styles.ratingText, { color: colors.oliveGreen }]}>
                            {rating === 5 && 'Excellent!'}
                            {rating === 4 && 'Very Good'}
                            {rating === 3 && 'Good'}
                            {rating === 2 && 'Fair'}
                            {rating === 1 && 'Poor'}
                        </Text>
                    </View>

                    {/* Comment */}
                    <View style={styles.commentSection}>
                        <Text style={[styles.label, { color: colors.text }]}>
                            Tell us more about your experience
                        </Text>
                        <TextInput
                            style={[
                                styles.textInput,
                                {
                                    backgroundColor: colors.card,
                                    color: colors.text,
                                    borderColor: colors.border,
                                },
                            ]}
                            placeholder="Write your review here..."
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            numberOfLines={6}
                            value={comment}
                            onChangeText={setComment}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Submit Button */}
                    <Pressable
                        style={[
                            styles.submitButton,
                            { backgroundColor: colors.darkBrown },
                            loading && styles.submitButtonDisabled,
                        ]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={colors.cream} />
                        ) : (
                            <Text style={[styles.submitButtonText, { color: colors.cream }]}>
                                SUBMIT REVIEW
                            </Text>
                        )}
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e8ddd4',
    },
    closeButton: {
        padding: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    content: {
        flex: 1,
        padding: 24,
    },
    ratingSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 16,
        textAlign: 'center',
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 8,
    },
    starButton: {
        padding: 4,
    },
    ratingText: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 8,
    },
    commentSection: {
        marginBottom: 32,
    },
    textInput: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        minHeight: 150,
    },
    submitButton: {
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1,
    },
});
