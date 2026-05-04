import { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    Image,
    ScrollView,
    FlatList,
    TouchableOpacity,
    Linking,
    Dimensions,
    Modal,
    StatusBar,
} from 'react-native';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FadeIn, FadeInUp, FadeInDown, ScaleIn } from '@utils/animations';
import Colors from '@styles/colors';
import styles from './styles';

const { width: SCREEN_W } = Dimensions.get('window');

// Khi backend bổ sung endpoint /api/restaurant/, thay khối này bằng API call.
const RESTAURANT_DATA = {
    name: 'SAIGON SAVORY',
    tagline: 'Ẩm thực Sài Gòn đích thực',
    description:
        'Saigon Savory mang đến tinh hoa ẩm thực ba miền với không gian đậm chất Sài Gòn xưa. ' +
        'Mỗi món ăn là một câu chuyện được kể bởi đầu bếp giàu kinh nghiệm, dùng nguyên liệu tươi mỗi ngày.',
    rating: 4.8,
    reviewCount: 1284,
    yearsOpen: 12,
    cuisine: 'Món Việt · Á Đông',
    photos: [
        'https://picsum.photos/seed/saigon-savory-1/1200/800',
        'https://picsum.photos/seed/saigon-savory-2/1200/800',
        'https://picsum.photos/seed/saigon-savory-3/1200/800',
        'https://picsum.photos/seed/saigon-savory-4/1200/800',
        'https://picsum.photos/seed/saigon-savory-5/1200/800',
        'https://picsum.photos/seed/saigon-savory-6/1200/800',
    ],
    branches: [
        {
            id: 1,
            name: 'Chi nhánh Đồng Khởi',
            isPrimary: true,
            address: '123 Đồng Khởi, P. Bến Nghé, Q.1, TP. HCM',
            phone: '028 3829 1234',
            hours: '10:00 – 22:30',
            distance: '0.8 km',
        },
        {
            id: 2,
            name: 'Chi nhánh Võ Văn Tần',
            isPrimary: false,
            address: '56 Võ Văn Tần, P. Võ Thị Sáu, Q.3, TP. HCM',
            phone: '028 3930 5678',
            hours: '10:00 – 22:00',
            distance: '2.4 km',
        },
        {
            id: 3,
            name: 'Chi nhánh Phú Mỹ Hưng',
            isPrimary: false,
            address: '28 Tôn Dật Tiên, P. Tân Phong, Q.7, TP. HCM',
            phone: '028 5410 9876',
            hours: '10:30 – 22:00',
            distance: '6.1 km',
        },
    ],
};

const callPhone = (phone) => {
    Linking.openURL(`tel:${phone.replace(/\s/g, '')}`).catch(() => { });
};

const openMaps = (address) => {
    const q = encodeURIComponent(address);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`).catch(() => { });
};

const HeroCarousel = ({ photos, onPhotoPress }) => {
    const [index, setIndex] = useState(0);

    const onScroll = (e) => {
        const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
        if (i !== index) setIndex(i);
    };

    return (
        <View style={styles.hero}>
            <FlatList
                data={photos}
                keyExtractor={(_, i) => `hero-${i}`}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                renderItem={({ item, index: i }) => (
                    <TouchableOpacity activeOpacity={0.95} onPress={() => onPhotoPress(i)}>
                        <Image source={{ uri: item }} style={styles.heroImage} />
                    </TouchableOpacity>
                )}
            />
            {/* Bottom dim overlay for legibility */}
            <View pointerEvents="none" style={styles.heroOverlay} />

            {/* Counter pill */}
            <View style={styles.heroCounter}>
                <MaterialCommunityIcons name="image-multiple" size={12} color={Colors.onPrimary} />
                <Text style={styles.heroCounterText}>{`${index + 1} / ${photos.length}`}</Text>
            </View>

            {/* Page dots */}
            <View style={styles.heroDots}>
                {photos.map((_, i) => (
                    <View
                        key={i}
                        style={[styles.heroDot, i === index && styles.heroDotActive]}
                    />
                ))}
            </View>
        </View>
    );
};

const StatBlock = ({ icon, value, label, color }) => (
    <View style={styles.statBlock}>
        <View style={[styles.statIcon, { backgroundColor: color + '18' }]}>
            <MaterialCommunityIcons name={icon} size={18} color={color} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const BranchCard = ({ branch, index }) => (
    <FadeInUp delay={index * 80} duration={400}>
        <View style={styles.branchCard}>
            <View style={styles.branchHeader}>
                <View style={styles.branchTitleRow}>
                    <Text style={styles.branchName}>{branch.name}</Text>
                    {branch.isPrimary && (
                        <View style={styles.primaryBadge}>
                            <MaterialCommunityIcons name="star" size={10} color={Colors.primary} />
                            <Text style={styles.primaryBadgeText}>Chi nhánh chính</Text>
                        </View>
                    )}
                </View>
                <View style={styles.distancePill}>
                    <MaterialCommunityIcons name="navigation-variant" size={11} color={Colors.tertiary} />
                    <Text style={styles.distanceText}>{branch.distance}</Text>
                </View>
            </View>

            <View style={styles.infoRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.infoText}>{branch.address}</Text>
            </View>
            <View style={styles.infoRow}>
                <MaterialCommunityIcons name="phone-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.infoText}>{branch.phone}</Text>
            </View>
            <View style={styles.infoRow}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.infoText}>{`Mở cửa ${branch.hours}`}</Text>
            </View>

            <View style={styles.branchActions}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.branchBtn, styles.branchBtnGhost]}
                    onPress={() => callPhone(branch.phone)}
                >
                    <MaterialCommunityIcons name="phone" size={16} color={Colors.tertiary} />
                    <Text style={[styles.branchBtnText, { color: Colors.tertiary }]}>Gọi</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.branchBtn, styles.branchBtnSolid]}
                    onPress={() => openMaps(branch.address)}
                >
                    <MaterialCommunityIcons name="directions" size={16} color={Colors.onPrimary} />
                    <Text style={[styles.branchBtnText, { color: Colors.onPrimary }]}>Chỉ đường</Text>
                </TouchableOpacity>
            </View>
        </View>
    </FadeInUp>
);

const PhotoLightbox = ({ visible, photos, startIndex, onClose }) => {
    const flatRef = useRef(null);
    const [index, setIndex] = useState(startIndex || 0);

    // Đồng bộ index khi mở lại với ảnh khác.
    useEffect(() => {
        if (visible) setIndex(startIndex || 0);
    }, [visible, startIndex]);

    const onScroll = (e) => {
        const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
        if (i !== index) setIndex(i);
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            <View style={styles.lightbox}>
                <TouchableOpacity style={styles.lightboxClose} onPress={onClose} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="close" size={22} color="#fff" />
                </TouchableOpacity>
                <View style={styles.lightboxCounter}>
                    <Text style={styles.lightboxCounterText}>{`${index + 1} / ${photos.length}`}</Text>
                </View>
                <FlatList
                    ref={flatRef}
                    data={photos}
                    keyExtractor={(_, i) => `lb-${i}`}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    initialScrollIndex={startIndex}
                    getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
                    onScroll={onScroll}
                    scrollEventThrottle={16}
                    renderItem={({ item }) => (
                        <View style={styles.lightboxSlide}>
                            <Image source={{ uri: item }} style={styles.lightboxImage} resizeMode="contain" />
                        </View>
                    )}
                />
            </View>
        </Modal>
    );
};

const RestaurantDetail = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [lightbox, setLightbox] = useState({ visible: false, startIndex: 0 });
    const data = RESTAURANT_DATA;

    const openLightbox = (i) => setLightbox({ visible: true, startIndex: i });
    const closeLightbox = () => setLightbox({ visible: false, startIndex: 0 });

    const goBooking = () => {
        navigation.navigate('Main', { screen: 'Booking' });
    };

    // Gallery photos = phần còn lại sau hero (lấy max 6 ảnh để 2x3 grid)
    const galleryPhotos = data.photos.slice(0, 6);

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                {/* Hero carousel */}
                <HeroCarousel photos={data.photos} onPhotoPress={openLightbox} />

                {/* Floating back button overlay */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.goBack()}
                    style={[styles.backBtn, { top: insets.top + 12 }]}
                >
                    <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.text} />
                </TouchableOpacity>

                {/* Info card overlapping hero */}
                <FadeInDown duration={500} style={styles.infoCard}>
                    <View style={styles.cuisinePill}>
                        <MaterialCommunityIcons name="silverware-fork-knife" size={11} color={Colors.primary} />
                        <Text style={styles.cuisineText}>{data.cuisine}</Text>
                    </View>
                    <Text style={styles.name}>{data.name}</Text>
                    <Text style={styles.tagline}>{data.tagline}</Text>

                    {/* Stats row */}
                    <View style={styles.statsRow}>
                        <StatBlock
                            icon="star"
                            value={data.rating.toFixed(1)}
                            label="Đánh giá"
                            color={Colors.star}
                        />
                        <View style={styles.statDivider} />
                        <StatBlock
                            icon="comment-text-multiple"
                            value={data.reviewCount.toLocaleString('vi-VN')}
                            label="Lượt review"
                            color={Colors.tertiary}
                        />
                        <View style={styles.statDivider} />
                        <StatBlock
                            icon="store-outline"
                            value={`${data.branches.length}`}
                            label="Chi nhánh"
                            color={Colors.success}
                        />
                    </View>

                    <Text style={styles.description}>{data.description}</Text>
                </FadeInDown>

                {/* Branches section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>Chi nhánh</Text>
                            <Text style={styles.sectionSubtitle}>
                                {`${data.branches.length} địa điểm phục vụ tại TP. HCM`}
                            </Text>
                        </View>
                        <View style={styles.sectionIcon}>
                            <MaterialCommunityIcons name="store-marker" size={20} color={Colors.primary} />
                        </View>
                    </View>

                    {data.branches.map((branch, i) => (
                        <BranchCard key={branch.id} branch={branch} index={i} />
                    ))}
                </View>

                {/* Gallery section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>Không gian nhà hàng</Text>
                            <Text style={styles.sectionSubtitle}>
                                Chạm để xem ảnh kích thước lớn
                            </Text>
                        </View>
                        <View style={styles.sectionIcon}>
                            <MaterialCommunityIcons name="image-multiple" size={20} color={Colors.primary} />
                        </View>
                    </View>

                    <View style={styles.gallery}>
                        {galleryPhotos.map((uri, i) => (
                            <ScaleIn key={i} delay={i * 60} duration={350} style={styles.galleryItemWrap}>
                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    style={styles.galleryItem}
                                    onPress={() => openLightbox(i)}
                                >
                                    <Image source={{ uri }} style={styles.galleryImage} />
                                </TouchableOpacity>
                            </ScaleIn>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Sticky bottom CTA */}
            <FadeIn duration={400} style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.bottomCta}
                    onPress={goBooking}
                >
                    <MaterialCommunityIcons name="calendar-clock" size={20} color={Colors.onPrimary} />
                    <Text style={styles.bottomCtaText}>Đặt bàn ngay</Text>
                </TouchableOpacity>
            </FadeIn>

            <PhotoLightbox
                visible={lightbox.visible}
                photos={data.photos}
                startIndex={lightbox.startIndex}
                onClose={closeLightbox}
            />
        </View>
    );
};

export default RestaurantDetail;
