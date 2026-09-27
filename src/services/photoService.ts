import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import { deletePhotoForEntry, getPhotosForEntries } from '@/database/repository/photoRepository';

const photoDirectory = new Directory(Paths.document, 'diary-photos');

async function storePickedAssets(assets: ImagePicker.ImagePickerAsset[]) {
  photoDirectory.create({ idempotent: true, intermediates: true });
  const storedPaths: string[] = [];
  for (const [index, asset] of assets.entries()) {
    const source = new File(asset.uri);
    const extension = source.extension || '.jpg';
    const destination = new File(photoDirectory, `photo-${Date.now()}-${index}${extension}`);
    await source.copy(destination);
    storedPaths.push(destination.uri);
  }
  return storedPaths;
}

export async function pickAndStorePhotos() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('Allow photo access to attach photos to your diary entry.');

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsMultipleSelection: true,
    mediaTypes: ['images'],
    orderedSelection: true,
    quality: 0.85,
  });
  if (result.canceled) return [];

  return storePickedAssets(result.assets);
}

export async function takeAndStorePhoto() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) throw new Error('Allow camera access to add a photo to your diary entry.');

  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85 });
  if (result.canceled) return [];
  return storePickedAssets(result.assets);
}

export async function deleteStoredPhoto(filePath: string) {
  const file = new File(filePath);
  if (file.exists) file.delete();
}

export async function removePhotoFromEntry(entryId: number, filePath: string) {
  await deleteStoredPhoto(filePath);
  await deletePhotoForEntry(entryId, filePath);
}

export async function loadPhotoPathsForEntries(entryIds: number[]) {
  return getPhotosForEntries(entryIds);
}
