import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";

interface AvatarUploadModalProps {
  open: boolean;
  onClose: () => void;
  onAvatarUpdate: (url: string) => void;
}

export const AvatarUploadModal: React.FC<AvatarUploadModalProps> = ({
  open,
  onClose,
  onAvatarUpdate,
}) => {
  const { user } = useUser();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match("image.*")) {
      showError("Please select an image file");
      return;
    }

    await uploadAvatar(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.match("image.*")) {
      showError("Please drop an image file");
      return;
    }

    await uploadAvatar(file);
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    
    setIsUploading(true);
    
    try {
      // First try to delete existing avatar if it exists
      const fileName = `${user.id}/avatar.png`;
      
      // Delete existing file (if any)
      const { error: deleteError } = await supabase.storage
        .from("avatars")
        .remove([fileName]);
      
      // Ignore delete errors (file might not exist)
      
      // Upload new file
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL with cache busting
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);
      
      // Update profile with new URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);
      
      if (updateError) throw updateError;
      
      // Add timestamp to bypass cache
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;
      
      onAvatarUpdate(cacheBustedUrl);
      showSuccess("Avatar updated successfully!");
      onClose();
    } catch (error) {
      showError("Failed to update avatar");
      console.error("Avatar upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Profile Picture</DialogTitle>
        </DialogHeader>
        
        <div 
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium">
                {isUploading ? "Uploading..." : "Drag & drop your image here"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">or click to browse files</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={isUploading}
            >
              Choose File
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};