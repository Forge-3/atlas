import React from "react";
import Header from "./Header.tsx";
import ReferalCard from "./ReferalCard.tsx";
import HubCard from "./HubCards.tsx";
import Button from "../Shared/Button.tsx";
import { ConnectWallet } from "@nfid/identitykit/react";
import GradientBox from "../../layouts/GradientBox.tsx";

const Home = () => {
  const data = [
    {
      heading: "Quest",
      text: "Complete quests by doing something for ICP growth.",
    },
    {
      heading: "Leaderboard",
      text: "Climb the leaderboard and grow your level.",
    },
    {
      heading: "Referrals",
      text: "Bring your friends to grow ICP together.",
    },
  ];

  return (
    <div className="flex flex-col pb-10">
      <Header />
      <GradientBox>
        <div className="font-medium md:text-2xl md2:text-3xl dlg:text-4xl flex justify-center items-center mt-10">
          <h2 className="text-white mt-10">
            ICP HUB is{" "}
            <span className="text-[#9173FF]">Everywhere for Everyone</span>
          </h2>
        </div>
        <div className="w-full pb-8 px-10">
          <HubCard />
        </div>
        <div className="flex justify-center items-center">
          <ConnectWallet
            connectButtonComponent={({ onClick }) => (
              <Button onClick={onClick} arrow={true} className="mt-8">
                Join your local hub
              </Button>
            )}
            dropdownMenuComponent={() => <></>}
          />
        </div>
        <div className="mt-10 flex justify-center items-center ">
          <h2 className=" flex flex-col items-center mt-6 mb-3 text-white md:text-2xl dlg:text-4xl font-semibold text-center px-16">
            <p className="">Atlas offers you to participate in the ICP</p>
            <p className="">activities, bring over your friends and </p>
            <p className="">climb up the ladder.</p>
          </h2>
        </div>
        <div className="flex justify-center gap-6 px-16 w-full flex-wrap  mt-10">
          {data.map((item, i) => {
            return (
              <ReferalCard key={i} title={item.heading} subtitle={item.text} />
            );
          })}
        </div>
        <div className="mt-24 w-full px-16 flex justify-center items-center mb-12">
          <div className="rounded-2xl w-full flex justify-between h-[600px] bg-cover bg-[url(/reward-bg-img.png)]">
            <div className="w-[35%] flex flex-col justify-end px-5 mb-4 py-6">
              <h2 className="font-semibold md:text-2xl dlg:text-3xl dxl:text-4xl text-white ">
                Earn rewards by being ICP Ambassador
              </h2>
            </div>
            <div className="flex w-[65%] justify-end items-center">
              <div className="flex flex-col justify-center items-center  py-6 px-8">
                <div className="flex  items-start justify-center md:ml-[35%] lg:ml-[35%] lg:mr-[5%] gap-6">
                  <img
                    src="/icons/small-a.png"
                    alt="atals icon"
                    className="w-[18px] h-[10px] mt-2.5"
                    draggable="false"
                  />

                  <h3 className="text-white md:text-sm md2:text-lg dxl:text-2xl font-medium">
                    Signup for Atlas with your Discord and join Atlas Server
                  </h3>
                </div>
                <div className="flex w-full items-center my-4 pl-[20%] justify-center">
                  <img
                    src="/icons/down-arrow-in-circle.png"
                    alt="arrow icon"
                    className="md:w-[24px] md:h-[24px] dxl:w-[34px] dxl:h-[34px]"
                    draggable="false"
                  />
                </div>
                <div className="flex items-start ml-[35%]  gap-6">
                  <img
                    src="/icons/small-a.png"
                    alt="atals icon"
                    className="w-[18px] h-[10px] mt-2.5"
                    draggable="false"
                  />

                  <h3
                    className="text-white md:text-sm md2:text-lg dxl:text-2xl font-medium
              "
                  >
                    Complete Quests and earn points
                  </h3>
                </div>
                <div className="flex items-center my-4 pl-[20%] justify-center">
                  <img
                    src="/icons/down-arrow-in-circle.png"
                    alt="arrow icon"
                    className="md:w-[24px] md:h-[24px] dxl:w-[34px] dxl:h-[34px]"
                    draggable="false"
                  />
                </div>
                <div className="flex items-start ml-[35%] mr-[5%] gap-6">
                  <img
                    src="/icons/small-a.png"
                    alt="atals icon"
                    className="w-[18px] h-[10px] mt-2.5"
                    draggable="false"
                  />

                  <h3 className="text-white md:text-sm md2:text-lg dxl:text-2xl font-medium">
                    Invite friends and earn points{" "}
                  </h3>
                </div>
                <div className="flex items-center my-4 pl-[20%] justify-center">
                  <img
                    src="/icons/down-arrow-in-circle.png"
                    alt="arrow icon"
                    className="md:w-[24px] md:h-[24px] dxl:w-[34px] dxl:h-[34px]"
                    draggable="false"
                  />
                </div>
                <div className="flex items-start ml-[35%] mr-[5%] gap-6">
                  <img
                    src="/icons/small-a.png"
                    alt="atals icon"
                    className="w-[18px] h-[10px] mt-2.5"
                    draggable="false"
                  />

                  <h3
                    className="text-white md:text-sm md2:text-lg dxl:text-2xl font-medium
              "
                  >
                    Get new levels, complete in leaderboard and earn points{" "}
                  </h3>
                </div>
                <div className="flex items-center my-4 pl-[20%] justify-center">
                  <img
                    src="/icons/down-arrow-in-circle.png"
                    alt="arrow icon"
                    className="md:w-[24px] md:h-[24px] dxl:w-[34px] dxl:h-[34px]"
                    draggable="false"
                  />
                </div>
                <div className="flex items-start ml-[35%] mr-[5%] gap-6">
                  <img
                    src="/icons/small-a.png"
                    alt="atals icon"
                    className="w-[18px] h-[10px] mt-2.5"
                    draggable="false"
                  />

                  <h3
                    className="text-white md:text-sm md2:text-lg dxl:text-2xl font-medium
              "
                  >
                    Redeem your rewards as you progress further{" "}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </GradientBox>
      <div className="font-semibold md:text-3xl dlg:text-5xl flex justify-center items-center mb my-14">
        <h2 className="text-white">
          We are <span className="text-[#9173FF]">big and growing</span>
        </h2>
      </div>{" "}
      <div className="flex w-full items-center justify-center flex-wrap gap-6 px-20 ">
        <div className="max-w-[418px] sm:w-[45%]  dlg:w-[30%]  h-[500px]  rounded-3xl bg-gradient-to-t from-[#574599]/5 to-[#9173FF]">
          <div className="mt-20">
            <h2 className="text-white md:text-[70px] dlx:text-[100px] font-medium text-center  ">
              20+{" "}
            </h2>
          </div>
          <div className="mt-20">
            <h2 className="text-white md:text-lg dlg:text-xl dxl:text-2xl font-semibold text-center">
              Around the globe and <br /> growing
            </h2>
          </div>
        </div>
        <div className="max-w-[418px] sm:w-[45%]  dlg:w-[30%]  h-[500px]  rounded-3xl bg-gradient-to-t from-[#574599]/5 to-[#9173FF]">
          <div className="mt-20">
            <h2 className="text-white md:text-[70px] dlx:text-[100px] font-medium text-center  ">
              1000+{" "}
            </h2>
          </div>
          <div className="mt-20">
            <h2 className="text-white md:text-lg dlg:text-xl dxl:text-2xl font-semibold text-center">
              Ambassadors supporting <br /> ICP worldwide
            </h2>
          </div>
        </div>
        <div className="max-w-[418px] sm:w-[45%]  dlg:w-[30%]  h-[500px]  rounded-3xl bg-gradient-to-t from-[#574599]/5  to-[#9173FF]">
          <div className="mt-20">
            <h2 className="text-white md:text-[70px] dlx:text-[100px] font-medium text-center  ">
              10+
              <span className="mt-3 md:text-[30px] dlg:text-[40px] dxl:text-[50px]">
                million
              </span>
            </h2>
          </div>
          <div className="mt-20">
            <h2 className="text-white md:text-lg dlg:text-xl dxl:text-2xl font-semibold text-center">
              Reach of ambassador <br /> program
            </h2>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center w-full px-20 mb-6 max-md:max-w-full container mx-auto">
        <div className="font-semibold md:text-3xl dlg:text-5xl flex justify-center items-center mb-2 mt-10">
          <h2 className="text-white">
            Find <span className="text-[#9173FF]">your HUB</span>
          </h2>
        </div>
        <img
          loading="lazy"
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/d822c282bdb0106f39f8d23a651f82d23a69b62c0ccf1110934061680d5be6f1?placeholderIfAbsent=true&apiKey=91e67b5675284a9cb9ba95a2fcd0d114"
          className="object-contain mt-14  w-full "
          alt="Hub location map 1"
        />
        <img
          loading="lazy"
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/7fb229ecdabead638c07ed9b60e64aeb42920f8f6141d018d545a2fc845f86cd?placeholderIfAbsent=true&apiKey=91e67b5675284a9cb9ba95a2fcd0d114"
          className="object-contain mt-16 w-full rounded-none "
          alt="Hub location map 2"
        />
        <img
          loading="lazy"
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/e3e72522816c1826b2ecd8f30bebcaf5ec88e1da9acffd77458f5c818e2b9742?placeholderIfAbsent=true&apiKey=91e67b5675284a9cb9ba95a2fcd0d114"
          className="object-contain mt-16 w-full "
          alt="Hub location map 3"
        />
        <img
          loading="lazy"
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/5c512ebcc342e9fe0121093437a3f2d2e93359e741217f83513d82eee21c7e6f?placeholderIfAbsent=true&apiKey=91e67b5675284a9cb9ba95a2fcd0d114"
          className="object-contain mt-16 w-full rounded-none "
          alt="Hub location map 4"
        />
        <img
          loading="lazy"
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/522b233489e174aef2abba7e96ecdf2956511e7d692c8900437a1023bfaff7f9?placeholderIfAbsent=true&apiKey=91e67b5675284a9cb9ba95a2fcd0d114"
          className="object-contain mt-16 w-full rounded-none "
          alt="Hub location map 5"
        />
        <img
          loading="lazy"
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/ed6c5251c948b0dfbdbf2fcf65beb7a0c27375c1df301d676b6d2011e3fd20a2?placeholderIfAbsent=true&apiKey=91e67b5675284a9cb9ba95a2fcd0d114"
          className="object-contain mt-16 w-full rounded-none "
          alt="Hub location map 6"
        />
      </div>
    </div>
  );
};

export default Home;
