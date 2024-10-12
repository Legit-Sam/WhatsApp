import { useEffect, useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ImageIcon, Plus, Video } from "lucide-react";
import { Dialog, DialogContent, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import Image from "next/image";
import ReactPlayer from "react-player";
import { useMutation, useQuery } from "convex/react";
import { useConversationStore } from "@/app/store/chatStore";
import { api } from "@/convex/_generated/api";

const MediaDropdown = () => {
  const imageInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateUploadUrl = useMutation(api.conversations.generateUploadUrl);
  const sendImage = useMutation(api.messages.sendImage);
  const sendVideo = useMutation(api.messages.sendVideo);
  const me = useQuery(api.users.getMe);
  const { selectedConversation } = useConversationStore();

  const handleFileUpload = async (file: File, sendFunc: any) => {
    try {
      setIsLoading(true);
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const { storageId } = await result.json();
      await sendFunc({
        conversation: selectedConversation!._id,
        sender: me!._id,
        imgId: storageId,
      });
    } catch (err) {
      console.error("Failed to upload file", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <input
        type="file"
        ref={imageInput}
        accept="image/*"
        hidden
        onChange={(e) => setSelectedImage(e.target.files![0])}
      />

      <input
        type="file"
        ref={videoInput}
        accept="video/mp4"
        hidden
        onChange={(e) => setSelectedVideo(e.target.files![0])}
      />

      {selectedImage && (
        <MediaDialog
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          file={selectedImage}
          isLoading={isLoading}
          handleSend={() => handleFileUpload(selectedImage, sendImage)}
          mediaType="image"
        />
      )}

      {selectedVideo && (
        <MediaDialog
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          file={selectedVideo}
          isLoading={isLoading}
          handleSend={() => handleFileUpload(selectedVideo, sendVideo)}
          mediaType="video"
        />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger>
          <Plus className="text-gray-600 dark:text-gray-400" />
        </DropdownMenuTrigger>

        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => imageInput.current!.click()}>
            <ImageIcon size={18} className="mr-1" /> Photo
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => videoInput.current!.click()}>
            <Video size={20} className="mr-1" />
            Video
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default MediaDropdown;

type MediaDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  file: File;
  isLoading: boolean;
  handleSend: () => void;
  mediaType: "image" | "video";
};

const MediaDialog = ({
  isOpen,
  onClose,
  file,
  isLoading,
  handleSend,
  mediaType,
}: MediaDialogProps) => {
  const [renderedMedia, setRenderedMedia] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setRenderedMedia(e.target?.result as string);
    reader.readAsDataURL(file);
  }, [file]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent>
        <DialogDescription className="flex flex-col gap-10 justify-center items-center">
          {mediaType === "image" && renderedMedia && (
            <Image src={renderedMedia} width={300} height={300} alt="Media" />
          )}

          {mediaType === "video" && renderedMedia && (
            <ReactPlayer url={renderedMedia} controls width="100%" />
          )}

          <Button className="w-full" disabled={isLoading} onClick={handleSend}>
            {isLoading ? "Sending..." : "Send"}
          </Button>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
};
