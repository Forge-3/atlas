import React from "react";
import Header from "./Header.tsx";
import ReferralCard from "./ReferralCard.tsx";
import HubCard from "./HubCards.tsx";
import Button from "../Shared/Button.tsx";
import { ConnectWallet } from "@nfid/identitykit/react";
import GradientBox from "../../layouts/GradientBox.tsx";
import EarnRewards from "./EarnRewards/index.tsx";
import FadeOutBox from "./FadeOutBox.tsx";
import { IoArrowForwardCircleOutline } from "react-icons/io5";

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
    <div className="flex flex-col pb-10 overflow-x-hidden">
      <Header />
      <GradientBox>
        <div className="font-medium text-2xl sm:text-3xl lg:text-4xl flex justify-center items-center sm:mt-10 px-4 text-center">
          <h2 className="text-white text-3xl sm:text-4xl mt-5 sm:mt-10">
            ICP HUB is{" "}
            <span className="text-[#9173FF]">Everywhere for Everyone</span>
          </h2>
        </div>
        <div className="w-full pb-8 px-4 sm:px-10">
          <HubCard />
        </div>
        <div className="flex justify-center items-center px-4">
          <ConnectWallet
            connectButtonComponent={({ onClick }) => (
              <Button onClick={onClick} arrow={true} className="mt-8">
                <div className=" flex items-center justify-center gap-2">
                  <IoArrowForwardCircleOutline size={30}/>
               <div>
                Join your local hub
                </div>
                </div>
              </Button>
            )}
            dropdownMenuComponent={() => <></>}
          />
        </div>
        <div className="mt-10 flex justify-center items-center px-4 text-center">
          <h2 className=" flex flex-col items-center sm:mt-6 mb-3 text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold">
            <p>Atlas offers you to participate in the ICP</p>
            <p>activities, bring over your friends and </p>
            <p>climb up the ladder.</p>
          </h2>
        </div>
        <div className="flex justify-center gap-6 px-4 flex-wrap mt-10 sm:px-6 md:px-16">
          {data.map((item, i) => {
            return (
              <ReferralCard key={i} title={item.heading} subtitle={item.text} />
            );
          })}
        </div>
        <div className="mt-16 sm:mt-24 container px-4 mx-auto sm:mb-12 sm:px-10 lg:px-16">
          <EarnRewards />
        </div>
      </GradientBox>
      <div className="font-semibold text-3xl sm:text-4xl lg:text-5xl flex justify-center items-center mb-8 my-4 px-4 text-center">
        <h2 className="text-white">
          We are <span className="text-[#9173FF]">big and growing</span>
        </h2>
      </div>{" "}
      <div className="flex flex-col sm:flex-row w-full items-center justify-center flex-wrap gap-6 px-4 font-montserrat sm:px-10 lg:px-20">
        <FadeOutBox>
          <div className="mt-10 flex flex-col gap-8 w-full sm:w-full">
            <h2 className="text-white text-3xl sm:text-4xl md:text-4xl font-medium text-center">
              20+{" "}
            </h2>
            <h2 className="text-white px-1 text-xs sm:text-base md:text-2xl font-semibold text-center">
              Around the globe and <br /> growing
            </h2>
          </div>
        </FadeOutBox>
        <FadeOutBox>
          <div className="mt-10 flex flex-col gap-8 w-full sm:w-auto md:w-auto">
            <h2 className="text-white text-3xl sm:text-4xl md:text-4xl font-medium text-center">
              1000+{" "}
            </h2>
            <h2 className="text-white px-1 text-xs sm:text-base md:text-2xl font-semibold text-center">
              Ambassadors supporting <br /> ICP worldwide
            </h2>
          </div>
        </FadeOutBox>
        <FadeOutBox>
          <div className="mt-10 flex flex-col gap-8 w-full sm:w-auto md:w-auto">
            <h2 className="text-white text-3xl sm:text-4xl md:text-4xl font-medium text-center">
              10+
              <span className="mt-3 text-2xl sm:text-3xl">million</span>
            </h2>
            <h2 className="text-white px-1 text-xs sm:text-base md:text-2xl font-semibold text-center">
              Reach of ambassador <br /> program
            </h2>
          </div>
        </FadeOutBox>
      </div>
      <div className="flex flex-col items-center w-full px-4 mb-6 max-md:max-w-full container mx-auto sm:px-10 lg:px-20">
        <div className="font-semibold text-3xl sm:text-4xl lg:text-5xl flex justify-center items-center mb-2 mt-10">
          <h2 className="text-white">
            Find <span className="text-[#9173FF]">your HUB</span>
          </h2>
        </div>
        <img
          loading="lazy"
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/d822c282bdb0106f39f8d23a651f82d23a69b62c0ccf1110934061680d5be6f1?placeholderIfAbsent=true&apiKey=91e67b5675284a9cb9ba95a2fcd0d114"
          className="object-contain mt-7 sm:mt-14 w-full"
          alt="Hub location map 1"
        />
        <img
          loading="lazy"
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/7fb229ecdabead638c07ed9b60e64aeb42920f8f6141d018d545a2fc845f86cd?placeholderIfAbsent=true&apiKey=91e67b5675284a9cb9ba95a2fcd0d114"
          className="object-contain mt-4 sm:mt-16 w-full rounded-none"
          alt="Hub location map 2"
        />
        <img
          loading="lazy"
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/e3e72522816c1826b2ecd8f30bebcaf5ec88e1da9acffd77458f5c818e2b9742?placeholderIfAbsent=true&apiKey=91e67b5675284a9cb9ba95a2fcd0d114"
          className="object-contain mt-4 sm:mt-16 w-full"
          alt="Hub location map 3"
        />
        <img
          loading="lazy"
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/5c512ebcc342e9fe0121093437a3f2d2e93359e741217f83513d82eee21c7e6f?placeholderIfAbsent=true&apiKey=91e67b5675284a9cb9ba95a2fcd0d114"
          className="object-contain mt-4 sm:mt-16 w-full rounded-none"
          alt="Hub location map 4"
        />
        <img
          loading="lazy"
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/522b233489e174aef2abba7e96ecdf2956511e7d692c8900437a1023bfaff7f9?placeholderIfAbsent=true&apiKey=91e67b5675284a9cb9ba95a2fcd0d114"
          className="object-contain mt-4 sm:mt-16 w-full rounded-none"
          alt="Hub location map 5"
        />
        <img
          loading="lazy"
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/ed6c5251c948b0dfbdbf2fcf65beb7a0c27375c1df301d676b6d2011e3fd20a2?placeholderIfAbsent=true&apiKey=91e67b5675284a9cb9ba95a2fcd0d114"
          className="object-contain mt-4 sm:mt-16 w-full rounded-none"
          alt="Hub location map 6"
        />
      </div>
    </div>
  );
};

export default Home;
