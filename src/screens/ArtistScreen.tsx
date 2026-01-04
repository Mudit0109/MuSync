import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../constants/theme';
import { usePlayerStore } from '../store/playerStore';
import { musicApi } from '../services/api';
import type { Song } from '../types';
import { formatDuration, formatPlayCount, getImageUrl, sanitizeTitle } from '../utils/helpers';
import type { RootStackParamList } from '../navigation';

export default function ArtistScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Artist'>>();
  const { artistId, artistName, artistImage } = route.params;
  const { playSong, currentSong, isPlaying, addToQueue } = usePlayerStore();

  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const res = await musicApi.getArtistSongs(artistId);
        const ok = res?.success === true;
        const list = ok ? res.data?.songs || res.data || [] : [];
        setSongs(list);
      } catch (e) {
        console.error('Artist songs error', e);
      } finally {
        setLoading(false);
      }
    };
    fetchSongs();
  }, [artistId]);

  const renderItem = ({ item, index }: { item: Song; index: number }) => {
    const isCurrent = currentSong?.id === item.id;
    const imageUrl = getImageUrl(item.image, '150x150') || artistImage || '';

    return (
      <View style={styles.songContainer}>
        <TouchableOpacity
          style={[styles.songRow, isCurrent && styles.activeRow]}
          onPress={() => playSong(item)}
          activeOpacity={0.7}
        >
          <Image source={{ uri: imageUrl }} style={styles.thumb} />
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>
              {sanitizeTitle(item.name)}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {sanitizeTitle(item.album?.name) || artistName || 'Unknown'}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {formatPlayCount(item.playCount)} plays • {formatDuration(item.duration)}
            </Text>
          </View>
          <Ionicons name={isCurrent && isPlaying ? 'pause' : 'play'} size={20} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => addToQueue(item)}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          {artistImage ? <Image source={{ uri: artistImage }} style={styles.headerAvatar} /> : null}
          <Text style={styles.headerTitle} numberOfLines={1}>
            {artistName}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.subtitle}>No songs found for this artist.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerTitleWrap: { flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: spacing.sm },
  headerAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: spacing.sm, backgroundColor: colors.surface },
  headerTitle: { ...typography.h3 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  songContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.md,
  },
  songRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  activeRow: { backgroundColor: colors.surface },
  thumb: { width: 52, height: 52, borderRadius: 4, backgroundColor: colors.surface, marginRight: spacing.md },
  title: { ...typography.body, fontWeight: '600' },
  subtitle: { ...typography.caption },
  meta: { ...typography.small, color: colors.textSecondary },
  addButton: {
    padding: spacing.sm,
    marginLeft: spacing.xs,
  },
  empty: { flex: 1, alignItems: 'center', marginTop: spacing.lg },
});
