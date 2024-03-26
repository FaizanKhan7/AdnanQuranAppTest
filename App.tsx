import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  LogBox,
  Animated,
} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import {heightPercentageToDP as hp} from 'react-native-responsive-screen';
import TrackPlayer from 'react-native-track-player';

import surahAlFatiha from './app/View/assets/translations/ar.json';
const {width} = Dimensions.get('window');

LogBox.ignoreAllLogs();

const App = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);

  const buttonRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setupAudio();
    const positionInterval = setInterval(async () => {
      const position = await TrackPlayer.getPosition();
      setCurrentPosition(position);
    }, 1000);

    return () => {
      clearInterval(positionInterval);
    };
  }, []);

  useEffect(() => {
    const positionInterval = setInterval(async () => {
      const position = await TrackPlayer.getPosition();
      setCurrentPosition(position);
    }, 1000);

    return () => {
      clearInterval(positionInterval);
    };
  }, []);

  useEffect(() => {
    const checkPlaybackEnd = async () => {
      const trackDuration = await TrackPlayer.getDuration();
      if (currentPosition >= trackDuration) {
        await TrackPlayer.stop();
        setIsPlaying(false);
        setCurrentPosition(0);
      }
    };

    const positionInterval = setInterval(async () => {
      const position = await TrackPlayer.getPosition();
      setCurrentPosition(position);
      checkPlaybackEnd(); // Check if playback has ended
    }, 1000);

    return () => {
      clearInterval(positionInterval);
    };
  }, [currentPosition]); // Re-run effect when currentPosition changes

  let prevHighlightedIndex = -1;

  const applyHighlightedStyle = () => {
    if (!surahAlFatiha || !surahAlFatiha.surah || !surahAlFatiha.surah.verses) {
      return []; // Return an empty array if data is not available
    }

    const currentTime = currentPosition; // Get the current playback position in seconds

    // Initialize an array to store styles for each verse
    const verseStyles = surahAlFatiha.surah.verses.map(() => ({
      ...styles.verseText, // Default style for each verse
    }));

    // Loop through verses to find the one matching the current timestamp
    for (let i = 0; i < surahAlFatiha.surah.verses.length; i++) {
      const verse = surahAlFatiha.surah.verses[i];
      const verseTime = convertTimestampToSeconds(verse.timestamp); // Convert timestamp to seconds

      // Apply highlighted style if the current time matches or exceeds the verse timestamp
      if (currentTime >= verseTime) {
        verseStyles[i] = {
          ...styles.verseText,
          ...styles.highlightedAyah, // Apply the highlightedAyah style
        };

        // Remove highlighted style for the previously highlighted index
        if (prevHighlightedIndex !== -1 && prevHighlightedIndex !== i) {
          verseStyles[prevHighlightedIndex] = {
            ...styles.verseText,
          };
        }

        // Update the previously highlighted index
        prevHighlightedIndex = i;
      } else {
        break; // Stop applying highlighted style for subsequent verses
      }
    }

    return verseStyles;
  };

  // Helper function to convert timestamp to seconds
  const convertTimestampToSeconds = (timestamp: string) => {
    const [minutes, seconds] = timestamp.split(':').map(Number);
    return minutes * 60 + seconds;
  };

  const setupAudio = async () => {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.add({
      id: 'surah',
      url: require('./app/View/assets/audio/level001.mp3'),
      title: 'Surah Al-Fatiha',
    });
  };

  const togglePlayback = async () => {
    if (isPlaying) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
    setIsPlaying(!isPlaying);
    animateButton();
  };

  const goBackToNextAyah = async () => {
    const currentTime = currentPosition;
    const nextTimestamp = getNextTimestamp(currentTime);

    if (nextTimestamp !== null) {
      await TrackPlayer.seekTo(nextTimestamp);
      await TrackPlayer.play();
      setIsPlaying(true);
    }
  };

  const getNextTimestamp = (currentTime: any) => {
    for (let i = 0; i < surahAlFatiha.surah.verses.length; i++) {
      const verse = surahAlFatiha.surah.verses[i];
      const verseTime = convertTimestampToSeconds(verse.timestamp);

      if (verseTime > currentTime) {
        return verseTime;
      }
    }
    return null; // No next timestamp found
  };

  const goBackToPrevAyah = async () => {
    // Find the previous verse timestamp and play audio from that point
    const currentTime = currentPosition;
    const prevTimestamp = getPrevTimestamp(currentTime);

    if (prevTimestamp !== null) {
      await TrackPlayer.seekTo(prevTimestamp);
      await TrackPlayer.play();
      setIsPlaying(true);
    }
  };

  const getPrevTimestamp = (currentTime: any) => {
    let closestPrevTimestamp = null;

    for (let i = surahAlFatiha.surah.verses.length - 1; i >= 0; i--) {
      const verse = surahAlFatiha.surah.verses[i];
      const verseTime = convertTimestampToSeconds(verse.timestamp);

      if (verseTime < currentTime) {
        closestPrevTimestamp = verseTime;
        break; // Stop when finding the closest previous verse timestamp
      }
    }

    return closestPrevTimestamp !== null ? closestPrevTimestamp : 0;
  };

  const animateButton = () => {
    Animated.timing(buttonRotation, {
      toValue: isPlaying ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const rotateInterpolation = buttonRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const buttonStyle = {
    transform: [{rotate: rotateInterpolation}],
  };

  const highlightedStyles = applyHighlightedStyle();

  return (
    <ImageBackground
      source={require('./app/View/assets/images/002.jpg')}
      style={styles.imageBackground}>
      <Image
        source={require('./app/View/assets/images/land_bar.png')}
        style={styles.landBar}
        resizeMode="contain"
      />

      <ImageBackground
        source={require('./app/View/assets/images/sorah_frame.png')}
        style={styles.surahFrame}
        resizeMode="contain">
        <Text style={styles.surahName}>{surahAlFatiha.surah.name}</Text>
        <View style={styles.verseContainer}>
          {surahAlFatiha.surah.verses.map((verse, index) => (
            <View style={{position: 'relative'}} key={verse.number}>
              <Text
                numberOfLines={5}
                style={[
                  highlightedStyles[index], // Apply styles based on the current timestamp
                  index === 0 && styles.firstVerse,
                  styles.verseText,
                ]}>
                {verse.text} {'\u06DD'}
              </Text>
              <Text style={styles.verseNumber}>{verse.number}</Text>
            </View>
          ))}
        </View>
      </ImageBackground>

      <View style={styles.buttonContainer}>
        <TouchableOpacity activeOpacity={0.5} onPress={goBackToPrevAyah}>
          <Image
            source={require('./app/View/assets/images/next_b_on_AppleTv.png')}
            style={styles.nextPrevButton}
          />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.5} onPress={togglePlayback}>
          <Animated.Image
            source={
              isPlaying
                ? require('./app/View/assets/images/Play_off_ApplTv.png')
                : require('./app/View/assets/images/Play_on_AppleTv.png')
            }
            style={[styles.playButton, buttonStyle]}
          />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.5} onPress={goBackToNextAyah}>
          <Image
            source={require('./app/View/assets/images/Back_b_on_AppleTv.png')}
            style={styles.nextPrevButton}
          />
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width,
  },
  imageBackground: {
    flex: 1,
    width,
  },
  surahFrame: {
    flex: 0.83,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  surahName: {
    fontFamily: 'surah_names',
    fontSize: hp(4),
    fontWeight: 'bold',
    textAlign: 'center',
    position: 'absolute',
    top: hp(12.5),
    left: 0,
    right: 0,
    paddingRight: hp(3),
  },
  verseContainer: {
    width: hp(80),
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(8.5),
  },
  firstVerse: {
    width: '100%',
    textAlign: 'center',
  },
  highlightedAyah: {
    backgroundColor: '#2BFAD8',
    borderRadius: 5,
    borderStyle: 'solid',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  verseText: {
    textAlign: 'center',
    margin: 5,
    fontSize: hp(4),
    lineHeight: hp(5.4),
  },
  verseNumber: {
    fontSize: hp(2.3),
    fontWeight: 'bold',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    position: 'absolute',
    top: hp(2.8),
    left: hp(3),
  },
  landBar: {
    width: '100%',
    position: 'absolute',
    bottom: hp(-6),
    left: 0,
    right: 0,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: hp(1),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: hp(18),
    height: hp(18),
    resizeMode: 'contain',
  },
  nextPrevButton: {
    width: hp(11),
    height: hp(11),
    resizeMode: 'contain',
  },
});

export default App;
