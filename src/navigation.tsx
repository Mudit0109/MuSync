import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './screens/HomeScreen';
import PlayerScreen from './screens/PlayerScreen';
import QueueScreen from './screens/QueueScreen';
import ArtistScreen from './screens/ArtistScreen';
import PlaylistScreen from './screens/PlaylistScreen';
import MiniPlayer from './components/MiniPlayer';
import { usePlayerStore } from './store/playerStore';
import { colors } from './constants/theme';

export type RootStackParamList = {
  Home: undefined;
  Player: undefined;
  Queue: undefined;
  Artist: { artistId: string; artistName: string; artistImage?: string };
  Playlist: { playlistId: string; playlistName: string; playlistImage?: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function Navigation() {
  const loadPersistedState = usePlayerStore((state) => state.loadPersistedState);

  useEffect(() => {
    loadPersistedState();
  }, [loadPersistedState]);

  return (
    <View style={styles.container}>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: colors.background },
            presentation: 'card',
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen
            name="Player"
            component={PlayerScreen}
            options={{
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="Queue"
            component={QueueScreen}
            options={{
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="Artist"
            component={ArtistScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Playlist"
            component={PlaylistScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
        <MiniPlayer />
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
