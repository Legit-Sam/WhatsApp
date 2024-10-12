"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Video, X } from "lucide-react";
import MessageInput from "./message-input";
import MessageContainer from "./message-container";
import ChatPlaceHolder from "@/components/home/chat-placeholder";
import GroupMembersDialog from "./group-members-dialog";
import { useConvexAuth } from "convex/react";
import { useConversationStore } from "@/app/store/chatStore";

const RightPanel = () => {
	const { selectedConversation, setSelectedConversation } = useConversationStore();
	const { isLoading } = useConvexAuth();

	if (isLoading) return null;
	if (!selectedConversation) return <ChatPlaceHolder />;

	const conversationName = selectedConversation.groupName || selectedConversation.name;
	const conversationImage = selectedConversation.groupImage || selectedConversation.image;

	return (
		<div className="w-full h-full flex flex-col lg:w-3/4 z-0 overflow-hidden"> {/* Prevent overall overflow */}
			<div className="w-full sticky top-0 z-40 bg-gray-primary"> {/* Header with fixed top positioning */}
				<div className="flex justify-between items-center p-3"> {/* Header content */}
					<div className="flex items-center gap-3">
						<Avatar>
							<AvatarImage src={conversationImage || "/placeholder.png"} className="object-cover" />
							<AvatarFallback>
								<div className="animate-pulse bg-gray-tertiary w-full h-full rounded-full" />
							</AvatarFallback>
						</Avatar>
						<div className="flex flex-col max-w-[200px] truncate"> {/* Text wrapping and width constraint */}
							<p className="truncate">{conversationName}</p> {/* Truncate long names */}
							{selectedConversation.isGroup && (
								<GroupMembersDialog selectedConversation={selectedConversation} />
							)}
						</div>
					</div>

					<div className="flex items-center gap-4 mr-5">
						<a href="/video-call" target="_blank">
							<Video size={23} />
						</a>
						<X size={16} className="cursor-pointer" onClick={() => setSelectedConversation(null)} />
					</div>
				</div>
			</div>

			{/* Chat Messages */}
			<div className="flex-grow overflow-y-auto"> {/* Ensure messages fit and are scrollable */}
				<MessageContainer />
			</div>

			{/* Input Area */}
			<div className="p-3 border-t border-gray-300"> {/* Keep input at the bottom */}
				<MessageInput />
			</div>
		</div>
	);
};

export default RightPanel;
