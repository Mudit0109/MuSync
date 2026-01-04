import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { musicApi } from '../services/api';
import { usePlayerStore } from '../store/playerStore';
import type { Song, Artist, Playlist } from '../types';
import { colors, spacing, typography } from '../constants/theme';
import { formatDuration, getImageUrl, formatPlayCount, debounce, sanitizeTitle } from '../utils/helpers';

import type { RootStackParamList } from '../navigation';

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastResultCount, setLastResultCount] = useState<number | null>(null);
  const [lastQuery, setLastQuery] = useState('');

  const navigation = useNavigation<any>();
  const { playSong, currentSong, isPlaying, recentlyPlayed, queue } = usePlayerStore((state) => ({
    playSong: state.playSong,
    currentSong: state.currentSong,
    isPlaying: state.isPlaying,
    recentlyPlayed: state.recentlyPlayed,
    queue: state.queue,
  }));

  const searchSongs = async (query: string, pageNum: number = 0, isLoadMore: boolean = false) => {
    if (!query.trim()) {
      setSongs([]);
      setLastResultCount(null);
      setErrorMessage('');
      return;
    }

    try {
      if (!isLoadMore) setIsLoading(true);
      setErrorMessage('');
      setLastQuery(query);

      const [songsRes, artistsRes, playlistsRes] = await Promise.all([
        musicApi.searchSongs(query, pageNum, 20),
        musicApi.searchArtists(query, pageNum, 12),
        musicApi.searchPlaylists(query, pageNum, 12),
      ]);

      const songsOk = songsRes?.success === true || songsRes?.status === 'SUCCESS';
      const artistsOk = artistsRes?.success === true;
      const playlistsOk = playlistsRes?.success === true;

      const newSongs = songsOk ? songsRes.data?.results || [] : [];
      const newArtists = artistsOk ? artistsRes.data?.results || [] : [];
      const newPlaylists = playlistsOk ? playlistsRes.data?.results || [] : [];

      setSongs((prev) => (isLoadMore ? [...prev, ...newSongs] : newSongs));
      const validArtists = newArtists.filter((a) => a.name && a.name.trim() && a.image);
      setArtists(validArtists);
      setPlaylists(newPlaylists);
      setHasMore(newSongs.length === 20);
      setLastResultCount(isLoadMore ? (lastResultCount ?? 0) + newSongs.length : newSongs.length);

      if (!songsOk) {
        setErrorMessage('Song search failed. Please try again.');
      }
    } catch (error) {
      console.error('Error searching songs:', error);
      setErrorMessage('Network error. Please check your connection.');
      setLastResultCount(0);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const debouncedSearch = useCallback(
     debounce<(query: string) => void>((query: string) => {
      setPage(1);
      searchSongs(query, 0);
    }, 500),
    []
  );

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };

  // Auto-run an initial search so the UI shows data without user typing
  useEffect(() => {
    searchSongs('arijit', 0);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setPage(1);
    searchSongs(searchQuery, 0);
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore && songs.length > 0) {
      const nextPage = page + 1;
      searchSongs(searchQuery || lastQuery, nextPage, true).then(() => setPage(nextPage));
    }
  };

  const handlePlaySong = (song: Song, index: number) => {
    playSong(song);
  };

  const renderSongItem = useCallback(
    ({ item, index }: { item: Song; index: number }) => {
      const isCurrentSong = currentSong?.id === item.id;
      const imageUrl = getImageUrl(item.image, '150x150');

      return (
        <TouchableOpacity
          style={[styles.songItem, isCurrentSong && styles.songItemActive]}
          onPress={() => playSong(item)}
          activeOpacity={0.7}
        >
          <View style={styles.songImage}>
            <Image source={{ uri: imageUrl }} style={styles.thumbnail} />
            {isCurrentSong && isPlaying && (
              <View style={styles.playingIndicator}>
                <Ionicons name="musical-notes" size={20} color={colors.primary} />
              </View>
            )}
          </View>

          <View style={styles.songInfo}>
            <Text style={styles.songTitle} numberOfLines={1}>
              {sanitizeTitle(item.name)}
            </Text>
            <Text style={styles.songArtist} numberOfLines={1}>
              {item.primaryArtists}
            </Text>
            <View style={styles.songMeta}>
              <Text style={styles.songMetaText}>{sanitizeTitle(item.album?.name) || 'Unknown album'}</Text>
              <Text style={styles.songMetaText}> • </Text>
              <Text style={styles.songMetaText}>{formatPlayCount(item.playCount)} plays</Text>
            </View>
          </View>

          <View style={styles.songActions}>
            <Text style={styles.duration}>{formatDuration(item.duration)}</Text>
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => {
                usePlayerStore.getState().addToQueue(item);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    },
    [currentSong?.id, isPlaying]
  );

  const renderEmptyState = useCallback(() => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyState}>
        <Ionicons name="search-outline" size={64} color={colors.textSecondary} />
        <Text style={styles.emptyTitle}>
          {searchQuery ? 'No songs found' : 'Search for songs'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {searchQuery
            ? 'Try searching with different keywords'
            : 'Enter a song name, artist, or album'}
        </Text>
        {errorMessage ? (
          <Text style={[styles.emptySubtitle, { color: colors.error, marginTop: spacing.sm }]}> 
            {errorMessage}
          </Text>
        ) : null}
      </View>
    );
  }, [searchQuery, errorMessage, isLoading]);

  const renderFooter = useCallback(() => {
    if (songs.length === 0) return null;

    return (
      <View style={styles.footer}>
        {isLoading && page > 1 ? (
          <View style={styles.paginationLoading}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.paginationText}>Loading page {page}...</Text>
          </View>
        ) : hasMore && !isLoading ? (
          <TouchableOpacity
            style={styles.loadMoreButton}
            onPress={handleLoadMore}
            activeOpacity={0.7}
          >
            <Text style={styles.loadMoreText}>Load More</Text>
            <Ionicons name="chevron-down" size={16} color={colors.primary} />
          </TouchableOpacity>
        ) : null}
        
        {songs.length > 0 && (
          <View style={styles.paginationInfo}>
            <Text style={styles.paginationInfoText}>
              Page {page} • {songs.length} songs loaded
            </Text>
          </View>
        )}
      </View>
    );
  }, [songs.length, isLoading, page, hasMore, handleLoadMore]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>MuSync</Text>
          <Text style={styles.headerSubtitle}>Feel the flow. Play instantly.</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.queueButton}
            onPress={() => navigation.navigate('Queue' as never)}
          >
            <Ionicons name="list" size={18} color={colors.text} />
            {queue.length > 0 && (
              <View style={styles.queueBadge}>
                <Text style={styles.queueBadgeText}>{queue.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.badge}>
            <Ionicons name="sparkles" size={14} color={colors.background} />
            <Text style={styles.badgeText}>Queue</Text>
          </View>
        </View>
      </View>

      {errorMessage ? (
        <View style={styles.bannerError}>
          <Ionicons name="alert-circle" size={16} color={colors.error} style={{ marginRight: 6 }} />
          <Text style={styles.bannerErrorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {lastResultCount !== null && !isLoading && (
        <View style={styles.bannerInfo}>
          <Text style={styles.bannerInfoText}>
            Showing {lastResultCount} result{lastResultCount === 1 ? '' : 's'} for “{lastQuery || searchQuery || 'arijit'}”
          </Text>
        </View>
      )}

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search songs, artists, albums..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {isLoading && page === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={songs}
          renderItem={renderSongItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          maxToRenderPerBatch={10}
          initialNumToRender={10}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={true}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            <View>
              <HomeSections
                artists={artists}
                playlists={playlists}
                recentlyPlayed={recentlyPlayed}
                onPlaySong={(song) => playSong(song)}
              />
              <SectionHeader title="Songs" />
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

const RecentCard = React.memo(({ item, onPress }: { item: Song; onPress: (song: Song) => void }) => (
  <TouchableOpacity style={styles.recentCard} onPress={() => onPress(item)}>
    <Image source={{ uri: getImageUrl(item.image, '150x150') }} style={styles.recentImage} />
    <Text style={styles.recentTitle} numberOfLines={1}>
      {sanitizeTitle(item.name)}
    </Text>
    <Text style={styles.recentSubtitle} numberOfLines={1}>
      {item.primaryArtists}
    </Text>
  </TouchableOpacity>
));

const ArtistCard = React.memo(({ item, onPress }: { item: Artist; onPress: (artist: Artist) => void }) => (
  <TouchableOpacity
    style={styles.artistCard}
    onPress={() => onPress(item)}
  >
    <Image
      source={{ uri: getImageUrl(item.image, '150x150') || undefined }}
      style={styles.artistAvatar}
    />
    <Text style={styles.artistName} numberOfLines={1}>
      {item.name.split(',')[0].trim()}
    </Text>
  </TouchableOpacity>
));

const PlaylistCard = React.memo(({ item, onPress }: { item: Playlist; onPress: (playlist: Playlist) => void }) => (
  <TouchableOpacity
    style={styles.playlistCard}
    onPress={() => onPress(item)}
  >
    <Image
      source={{ uri: getImageUrl(item.image, '150x150') || undefined }}
      style={styles.playlistImage}
    />
    <Text style={styles.playlistTitle} numberOfLines={1}>
      {item.name}
    </Text>
    <Text style={styles.playlistSubtitle} numberOfLines={1}>
      {item.language || 'Playlist'}
    </Text>
  </TouchableOpacity>
));

function HomeSections({
  artists,
  playlists,
  recentlyPlayed,
  onPlaySong,
}: {
  artists: Artist[];
  playlists: Playlist[];
  recentlyPlayed: Song[];
  onPlaySong: (song: Song) => void;
}) {
  const navigation = useNavigation();
  const hasRecents = recentlyPlayed.length > 0;

  const handleNavigateToArtist = useCallback(
    (artist: Artist) => {
      (navigation as any).navigate('Artist', {
        artistId: artist.id,
        artistName: artist.name,
        artistImage: getImageUrl(artist.image, '150x150'),
      });
    },
    [navigation]
  );

  const handleNavigateToPlaylist = useCallback(
    (playlist: Playlist) => {
      (navigation as any).navigate('Playlist', {
        playlistId: playlist.id,
        playlistName: playlist.name,
        playlistImage: getImageUrl(playlist.image, '150x150'),
      });
    },
    [navigation]
  );

  return (
    <View style={{ paddingBottom: spacing.lg }}>
      {hasRecents && (
        <View>
          <SectionHeader title="Recently Played" />
          <FlatList
            data={recentlyPlayed}
            keyExtractor={(item) => `recent-${item.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => <RecentCard item={item} onPress={onPlaySong} />}
            maxToRenderPerBatch={5}
            initialNumToRender={5}
            removeClippedSubviews={true}
          />
        </View>
      )}

      {artists.length > 0 && (
        <View>
          <SectionHeader title="Artists" />
          <FlatList
            data={artists}
            keyExtractor={(item) => `artist-${item.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => <ArtistCard item={item} onPress={handleNavigateToArtist} />}
            maxToRenderPerBatch={5}
            initialNumToRender={5}
            removeClippedSubviews={true}
          />
        </View>
      )}

      {playlists.length > 0 && (
        <View>
          <SectionHeader title="Playlists" />
          <FlatList
            data={playlists}
            keyExtractor={(item) => `playlist-${item.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => <PlaylistCard item={item} onPress={handleNavigateToPlaylist} />}
            maxToRenderPerBatch={5}
            initialNumToRender={5}
            removeClippedSubviews={true}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  queueButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  queueBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  queueBadgeText: {
    ...typography.small,
    color: colors.background,
    fontWeight: '700',
  },
  brand: {
    ...typography.h1,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  badgeText: {
    ...typography.small,
    color: colors.background,
    marginLeft: spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    height: 48,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 100, // Space for mini player
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
  },
  horizontalList: {
    paddingHorizontal: spacing.md,
  },
  recentCard: {
    width: 140,
    marginRight: spacing.md,
  },
  recentImage: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    backgroundColor: colors.surface,
    marginBottom: spacing.xs,
  },
  recentTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  recentSubtitle: {
    ...typography.caption,
  },
  artistCard: {
    width: 100,
    alignItems: 'center',
    marginRight: spacing.md,
  },
  artistAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    marginBottom: spacing.xs,
  },
  artistName: {
    ...typography.caption,
    textAlign: 'center',
  },
  playlistCard: {
    width: 160,
    marginRight: spacing.md,
  },
  playlistImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: colors.surface,
    marginBottom: spacing.xs,
  },
  playlistTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  playlistSubtitle: {
    ...typography.caption,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  songItemActive: {
    backgroundColor: colors.card,
  },
  songImage: {
    position: 'relative',
    marginRight: spacing.md,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 4,
    backgroundColor: colors.surface,
  },
  playingIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  songInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  songTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 4,
  },
  songArtist: {
    ...typography.caption,
    marginBottom: 2,
  },
  songMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  songMetaText: {
    ...typography.small,
  },
  songActions: {
    alignItems: 'flex-end',
  },
  duration: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  moreButton: {
    padding: spacing.xs,
  },
  bannerError: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    backgroundColor: '#2a0f0f',
    borderRadius: 6,
  },
  bannerErrorText: {
    ...typography.caption,
    color: colors.error,
  },
  bannerInfo: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 6,
  },
  bannerInfoText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.caption,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  paginationLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  paginationText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  loadMoreText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  paginationInfo: {
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  paginationInfoText: {
    ...typography.small,
    color: colors.textSecondary,
  },
});
