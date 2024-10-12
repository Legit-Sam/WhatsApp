"use client";
import { useState } from "react";
import { ListFilter, Search, Menu } from "lucide-react"; // Import Menu icon
import { Input } from "../ui/input";
import ThemeSwitch from "./theme-switch";
import Conversation from "./conversation";
import { UserButton } from "@clerk/nextjs";
import UserListDialog from "./user-list-dialog";
import { useConvexAuth, useQuery } from "convex/react";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { useConversationStore } from "@/app/store/chatStore";

const LeftPanel = () => {
  const [isOpen, setIsOpen] = useState(false); // State to toggle visibility
  const { isAuthenticated, isLoading } = useConvexAuth();
  const conversations = useQuery(
    api.conversations.getMyConversations,
    isAuthenticated ? undefined : "skip"
  );
  const { selectedConversation, setSelectedConversation } = useConversationStore();

  useEffect(() => {
    const conversationIds = conversations?.map((c) => c._id);
    if (selectedConversation && conversationIds && !conversationIds.includes(selectedConversation._id)) {
      setSelectedConversation(null);
    }
  }, [conversations, selectedConversation, setSelectedConversation]);

  if (isLoading) return null;

  const togglePanel = () => setIsOpen(!isOpen); // Toggle function

  return (
    <>
      {/* Button to open the panel on smaller screens */}
      <button 
        className="p-2 fixed top-4 left-4 z-20 lg:hidden" 
        onClick={togglePanel}
      >
        <Menu size={24} /> {/* Menu icon */}
      </button>

      {/* Left Panel */}
      <div
        className={`fixed lg:static top-0 left-0 w-3/4 lg:w-1/4 h-full border-gray-600 border-r bg-gray-800 transition-transform duration-300 
          ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 z-30`}
      >
        {/* Panel Header */}
        <div className="sticky top-0 bg-left-panel z-10">
          <div className="flex justify-between bg-gray-primary p-3 items-center">
            <UserButton />

            <div className="flex items-center gap-3">
              {isAuthenticated && <UserListDialog />}
              <ThemeSwitch />
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-3 flex items-center">
            <div className="relative h-10 mx-3 flex-1">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10"
                size={18}
              />
              <Input
                type="text"
                placeholder="Search or start a new chat"
                className="pl-10 py-2 text-sm w-full rounded shadow-sm bg-gray-primary focus-visible:ring-transparent"
              />
            </div>
            <ListFilter className="cursor-pointer" />
          </div>
        </div>

        {/* Conversations List */}
        <div className="my-3 flex flex-col gap-0 max-h-[80%] overflow-auto">
          {conversations?.map((conversation) => (
            <Conversation key={conversation._id} conversation={conversation} />
          ))}

          {conversations?.length === 0 && (
            <>
              <p className="text-center text-gray-500 text-sm mt-3">No conversations yet</p>
              <p className="text-center text-gray-500 text-sm mt-3">
                We understand {"you're"} an introvert, but {"you've"} got to start somewhere 😊
              </p>
            </>
          )}
        </div>
      </div>

      {/* Overlay to close the panel when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" 
          onClick={togglePanel}
        />
      )}
    </>
  );
};

export default LeftPanel;
