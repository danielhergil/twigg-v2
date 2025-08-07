# Setting up Avatars Storage in Supabase

## Step 1: Create the Avatars Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create Bucket**
4. Name the bucket `avatars`
5. Set the bucket to **Public** (this allows avatars to be displayed publicly)
6. Click **Create Bucket**

## Step 2: Set up Storage Policies

1. In the Storage section, click on the `avatars` bucket
2. Go to the **Settings** tab
3. Scroll down to **Policies**
4. Create the following policies:

### Policy 1: Allow users to insert their own avatars
- **Name**: Users can upload avatars
- **Operation**: INSERT
- **Policy Type**: Permissive
- **USING** (leave empty)
- **WITH CHECK**: 
```sql
(bucket_id = 'avatars' AND (storage.foldername(name))[1] = (auth.uid())::text)
```

### Policy 2: Allow users to update their own avatars
- **Name**: Users can update their avatars
- **Operation**: UPDATE
- **Policy Type**: Permissive
- **USING**: 
```sql
(bucket_id = 'avatars' AND (storage.foldername(name))[1] = (auth.uid())::text)
```
- **WITH CHECK**: 
```sql
(bucket_id = 'avatars' AND (storage.foldername(name))[1] = (auth.uid())::text)
```

### Policy 3: Allow public read access to avatars
- **Name**: Public read access for avatars
- **Operation**: SELECT
- **Policy Type**: Permissive
- **USING**: 
```sql
(bucket_id = 'avatars')
```
- **WITH CHECK** (leave empty)

## Step 3: Test the Setup

After setting up the policies:
1. Try uploading an avatar through your app
2. Check that the avatar appears correctly in the profile
3. Verify that users can only access their own avatars

## Troubleshooting

If you encounter issues:
1. Make sure the bucket is set to Public
2. Verify that all three policies are correctly set up
3. Check that the folder structure in the bucket follows the pattern: `user_id/timestamp.png`
4. Ensure your Supabase client is properly configured with the correct permissions