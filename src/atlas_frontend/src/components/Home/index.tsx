import React from "react";
import Header from "./Header.tsx";
import Button from "../Shared/Button.tsx";
import { ConnectWallet } from "@nfid/identitykit/react";
import EarnRewards from "./EarnRewards/index.tsx";
import { RiArrowRightBoxFill } from 'react-icons/ri';

const Home = () => {
  return (
    <div className="flex flex-col overflow-x-hidden">
      <Header />
        <div className="flex justify-center">
          <h2 className="text-white font-montserrat text-center text-[20px] md:text-h2 font-medium pt-12 md:pt-36 md:pb-10">
            ATLAS rewards ICP community leaders <br />
            via missions and referrals.
          </h2>
        </div>
        <div className="w-full pb-8 px-4 sm:px-10">
        </div>
        <div className="flex flex-col px-4 md:px-0 lg:flex-row justify-center font-montserrat">
          <div className="flex flex-col p-8 w-full lg:h-[538px] rounded-md shadow-md bg-light">
            <div className="flex flex-col sm:px-10">
              <h2 className="text-black text-[26px] md:text-h2 font-medium mb-2">Mission</h2>
              <p className="text-black md:text-h3 font-medium">Complete missions by doing something for ICP growth.</p>
            </div>
            <div className="flex flex-1 justify-center mt-8">
              <img
                src="/icons/mission.png"
                alt="Icon"
                className="w-[175.62px] h-[203px] sm:w-[263px] sm:h-[304px] mb-6"
              />
            </div>
          </div>
          <div className="flex flex-col p-8 w-full md:h-[538px] rounded-md shadow-md bg-primary">
            <div className="flex flex-col sm:px-10">
              <h2 className="text-black text-[26px] md:text-h2 font-medium mb-2">Leaderboard</h2>
              <p className="text-black md:text-h3 font-medium">Climb the leaderboard and grow your level.</p>
            </div>
            <div className="flex flex-1 justify-center mt-8">
              <img
                src="/icons/leaderboard.png"
                alt="Icon"
                className="w-[158.63px] h-[232px] sm:w-[227px] sm:h-[332px] mb-6"
              />
            </div>
          </div>
          <div className="flex flex-col p-8 w-full md:h-[538px] rounded-md shadow-md bg-dark">
            <div className="flex flex-col sm:px-10 text-light">
              <h2 className="text-[26px] md:text-h2 font-medium mb-2">Referrals</h2>
              <p className="md:text-h3 font-medium">Bring your friends to grow ICP together.</p>
            </div>
            <div className="flex flex-1 justify-center mt-8">
              <img
                src="/icons/referrals.png"
                alt="Icon"
                className="w-[99.23px] h-[232px] sm:w-[142px] sm:h-[332px] mb-6"
              />
            </div>
          </div>
        </div>
        <div className="md:mt-16 container px-4 mx-auto">
          <EarnRewards />
        </div>
        <div className="flex flex-col sm:flex-row bg-dark rounded-lg h-auto md:my-20 mx-4 md:mx-10">
          <div className="flex flex-col flex-none sm:flex-2">
            <div className="flex py-6 md:py-10 px-4 md:px-6">
              <img src="/icons/big-and-growing.png" alt="Big and Growing" />
            </div>
            <div className="flex">
              <h4 className="text-h4 font-montserrat text-white font-medium px-6 md:pb-10">
                We&apos;re Big. <br />
                We&apos;re Growing. <br />
                You in?
              </h4>
            </div>
          </div>
          <div className="flex flex-col flex-1 px-6 pb-10 pt-7 font-montserrat">
            <h3 className="text-white text-[60px] md:text-[100px] leading-7">
              20+
            </h3>
            <p className="text-white text-p">
              Around the globe and growing
            </p>

            <h3 className="text-white text-[80px] md:text-[120px] pt-10 leading-7">
              1000+
            </h3>
            <p className="text-white text-p">
              Champions supporting ICP <br />worldwide
            </p>

            <h3 className="text-white text-[80px] md:text-[120px] pt-10 leading-7">
              10+M
            </h3>
            <p className="text-white text-p">
              Reach of ATLAS program
            </p>
          </div>
        </div>
      <div>
        <h4 className="text-h3 md:text-h4 font-montserrat font-medium text-white text-center pt-12 md:pt-24 pb-5 md:pb-10">
          ICP HUBS are Everywhere. <br />
          For Everyone. <br />
          Even You.
        </h4>
      </div>
      <div className="flex justify-center w-full">
        <div className="grid grid-cols-3 md:grid-cols-6 w-auto gap-3 md:gap-10 justify-items-center mt-4 md:mt-12 px-4 ">
          <img
          src="/hubs/AR-square.png"
          />
          <img
          src="/hubs/BG-square.png"
          />
          <img
          src="/hubs/CA-square.png"
          />
          <img
          src="/hubs/ID-square.png"
          />
          <img
          src="/hubs/IN-square.png"
          />
          <img
          src="/hubs/KE-square.png"
          />
          <img
          src="/hubs/KR-square.png"
          />
          <img
          src="/hubs/PH-square.png"
          />
          <img
          src="/hubs/PL-square.png"
          />
          <img
          src="/hubs/UA-square.png"
          />
          <img
          src="/hubs/VN-square.png"
          />
          <img
          src="/hubs/NG-square.png"
          />
        </div>
      </div>
      <div className="flex justify-center items-center mt-10 mb-8 md:mb-28">
          <ConnectWallet
            connectButtonComponent={({ onClick }) => (
              <Button
              variant="publish"
              onClick={onClick} 
              arrow={true} 
              className="mt-4 md:mt-8">
                <div className=" flex items-center justify-center gap-2 text-[12px] md:text-base px-2 rounded-xl">
                  <RiArrowRightBoxFill  className="text-xl md:text-2xl"/>
               <h3 className="font-medium">
                Join your local hub
                </h3>
                </div>
              </Button>
            )}
            dropdownMenuComponent={() => <></>}
          />
        </div>
      <div className="grid">
        <img
          className="col-start-1 row-start-1 w-full h-48 sm:h-auto object-cover max-h-[473px]"
          src="/ambassador-program-bg.png"
          alt="Ambassador Program Background"
        />
        <h4 className="col-start-1 row-start-1 font-montserrat self-center justify-self-start text-white font-medium px-6 pt-4 lg:px-20 lg:pt-24">
          <span className="text-[28px] sm:text-h2 md:text-h4">
            Join the Movement. <br />
            Become an ICP <br />
            Ambassador Today.
          </span>
          <ConnectWallet
            connectButtonComponent={({ onClick }) => (
              <Button
              variant="publish"
              onClick={onClick} 
              arrow={true} 
              className="px-4 text-[14px] sm:text-base mt-6">
                Join Ambassador Program
              </Button>
            )}
            dropdownMenuComponent={() => <></>}
          />
        </h4>
      </div>
    </div>
  ); 
};

export default Home;