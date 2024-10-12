import { randomID } from "@/lib/utils";
import { useClerk } from "@clerk/nextjs";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";

export function getUrlParams(url = window.location.href) {
	const urlStr = url.split("?")[1]; // Change from let to const
	return new URLSearchParams(urlStr);
}

export default function VideoUIKit() {
	const roomID = getUrlParams().get("roomID") || randomID(5);
	const { user } = useClerk();

	const myMeeting = (element: HTMLDivElement) => { // Change from let to const
		const initMeeting = async () => {
			if (!user) {
				console.error("User not found");
				return;
			}
			
			const res = await fetch(`/api/zegocloud?userID=${user.id}`); // Removed non-null assertion
			const { token, appID } = await res.json();

			const username = user.fullName || user.emailAddresses[0].emailAddress.split("@")[0];

			const kitToken = ZegoUIKitPrebuilt.generateKitTokenForProduction(appID, token, roomID, user.id, username);

			const zp = ZegoUIKitPrebuilt.create(kitToken);
			zp.joinRoom({
				container: element,
				sharedLinks: [
					{
						name: "Personal link",
						url:
							window.location.protocol +
							"//" +
							window.location.host +
							window.location.pathname +
							"?roomID=" +
							roomID,
					},
				],
				scenario: {
					mode: ZegoUIKitPrebuilt.GroupCall, // Modify for 1-on-1 calls if needed.
				},
			});
		};
		initMeeting();
	};

	return <div className='myCallContainer' ref={myMeeting} style={{ width: "100vw", height: "100vh" }}></div>;
}
