import { useAuth } from "@nfid/identitykit/react";
import DarkBox from "../../layouts/DarkBox.tsx";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const MissionApp = () => {
  const { user } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!user) {
      nav("/");
    }
  }, [nav, user]);

  return (
    <div className="container mx-auto my-4">
      <DarkBox>
        <div className="bg-[url(/hubs/background-india.png)] w-full h-52 rounded-3xl bg-center bg-no-repeat bg-cover flex justify-end place-items-end">
          <div className="font-roboto flex text-white text-4xl items-center justify-center m-4 gap-2">
            <img src="/logos/icp-bold-uppercase.svg" draggable="false" />{" "}
            <span>India</span>
          </div>
        </div>
        <div className="flex mt-4">
          <div className="bg-white flex rounded-3xl flex-none">
            <img
              src="/hubs/logo-india-square.png"
              draggable="false"
              className="rounded-3xl m-[5px] w-full"
            />
          </div>
          <div className="my-1 mx-4 text-white font-montserrat">
            <h1 className="font-semibold text-4xl">ICP HUB India</h1>
            <p>
              Join the ICP Hub – where technology meets action! Complete tasks,
              explore the ICP blockchain, and earn rewards for your engagement.
            </p>
          </div>
        </div>
      </DarkBox>
    </div>
  );
};

export default MissionApp;
