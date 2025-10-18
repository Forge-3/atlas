import React from "react";
import { useSelector } from "react-redux";
import { deserialize } from "../../store/store";
import { selectUserBlockchainData, type StorableUser } from "../../store/slices/userSlice";
import { deciXPtoXP, getChampionLevel, getChampionTitle, getMaxReferralsForLevel } from "../../utils/xp";
import { mediumPrincipal } from "../../utils/icp";

const ReferralSection = () => {
  const userData = deserialize<StorableUser>(
    useSelector(selectUserBlockchainData)
  );

  if (!userData) return null;

  const totalReferralPoints = userData.referral_rewards.reduce(
    (acc, r) => acc + deciXPtoXP(r.points),
    0
  );

  const rewardsByUser: Record<string, { tasks: number[]; points: number }> = {};
  userData.referral_rewards.forEach(r => {
    const user = r.invitee.toText();
    if (!rewardsByUser[user]) {
      rewardsByUser[user] = { tasks: [], points: 0 };
    }
    rewardsByUser[user].tasks.push(Number(r.task_id));
    rewardsByUser[user].points += deciXPtoXP(r.points);
  });

  const rewardsArray = Object.entries(rewardsByUser).map(([user, data]) => ({
    user,
    tasks: data.tasks.join(", "),
    points: data.points,
  }));

  const championLevel = getChampionLevel(deciXPtoXP(userData.deci_xp_points));
  const maxReferrals = getMaxReferralsForLevel(championLevel);
  const championTitle = getChampionTitle(championLevel);

  const totalReferralsUsed = userData.referral_rewards.length;
  const remainingReferrals = maxReferrals - totalReferralsUsed;

  return (
    <div className="relative w-full rounded-xl overflow-hidden font-montserrat mt-8">
      <div className="absolute inset-0 bg-[#1E0F33] z-0" />

      <div className="relative px-6 py-6 flex flex-col gap-6 text-white">
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 justify-between">
          <div className="w-full md:w-1/3 min-h-[160px] bg-white/10 backdrop-blur-sm rounded-2xl text-left p-6 flex flex-col justify-center">
            <div className="text-2xl font-bold">Your Referral Earnings</div>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-xl font-semibold">{totalReferralPoints}</span>
              <span className="text-sm text-gray-300">points</span>
            </div>
          </div>

          <div className="w-full md:w-2/3 min-h-[160px] bg-[url(/reward-bg-img.png)] bg-cover bg-center [mix-blend-mode:luminosity] backdrop-blur-sm rounded-2xl text-center flex flex-col justify-center">
            <div className="text-xl font-semibold">Max referral rewards uses for rank ({championTitle}): </div>
            <div className="text-3xl text-[#00FFAA] font-bold mt-2">{maxReferrals}</div>
            <div className="mt-2 text-base text-gray-300">
              Remaining referral rewards uses:{" "}
              <span className="text-white font-semibold">{remainingReferrals}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#9173FF]/20 backdrop-blur-sm p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
            <div className="text-xl font-semibold">Current single referral reward</div>
            <div className="flex-1 flex justify-center">
              <div className="text-white border-b border-white px-4 pb-1">
                {"+2 CkUsdc"}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="md:w-1/3 flex flex-col">
            <div className="bg-white/10 backdrop-blur-sm p-3 h-1/3 min-h-[80px] rounded-2xl text-3xl  font-semibold text-center flex items-end justify-center">
              Your Referrals
            </div>
          </div>
          
          <div className="md:w-2/3 backdrop-blur-sm p-6 rounded-2xl"
            style={{
              background: "linear-gradient(180deg, rgba(217, 217, 217, 0.05) 0%, rgba(145, 115, 255, 0.01) 100%)"
            }}
          >
            <div className="grid grid-cols-3 gap-4 text-[#9173FF] font-semibold border-b border-[#9173FF] pb-2">
              <div>User</div>
              <div>Task ID</div>
              <div>Points</div>
            </div>

            <div className="mt-2">
              {rewardsArray.map((r, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 text-white py-1">
                  <div>{mediumPrincipal(r.user)}</div>
                  <div>{r.tasks}</div>
                  <div>{r.points}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralSection;
