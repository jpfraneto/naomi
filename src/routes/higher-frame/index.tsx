import { Button, FrameContext, Frog, TextInput } from 'frog';
import { Logger } from '../../../utils/Logger';
import { AIRSTACK_API_KEY } from '../../../env/server-env';
import queryString from 'query-string';


import { NeynarVariables } from 'frog/middlewares';
import { getOrCreateUser, getUserWorkoutHistory, hasUserCompletedWorkoutToday, updateUserWorkout } from '../../../utils/workouts';


type VibraState = {
  // profiles
  page?: number;
  config: {
    fid?: number;
    pfp_url?: string;
    username?: string;
    points?: number;
    rank?: number;
  };
};

const imageOptions = {
  width: 600,
  height: 600,
  fonts: [
    {
      name: 'Poetsen One',
      source: 'google',
    },
    {
      name: 'Roboto',
      source: 'google',
    },
  ] as any,
};

export type VibraContext<T extends string = '/logic/:castHash'> = FrameContext<
  {
    Variables: NeynarVariables;
    State: VibraState;
  },
  T,
  {}
>;

export const higherFrame = new Frog<{
  State: VibraState;
}>({
  // hub: {
  //   apiUrl: "https://hubs.airstack.xyz",
  //   fetchOptions: {
  //     headers: {
  //       "x-airstack-hubs": AIRSTACK_API_KEY,
  //     }
  //   }
  // },
  imageOptions,
  imageAspectRatio: "1:1",
  initialState: {
    page: 0,
    config: {}
  }
})

higherFrame.use(async (c, next) => {
  Logger.info(`[${c.req.method}] : : :  ${c.req.url}`);
  c.res.headers.set('Cache-Control', 'max-age=0');
  await next();
});

type DayInfo = {
  gifUrl: string;
  number: number;
  day: string;
  workout: string;
  title: string;
  instructions: string;
  confirmation: string;
  shareText: string;
};

const daysInfo: Record<string, DayInfo> = {
  "1": {
    gifUrl: "https://github.com/jpfraneto/images/blob/main/dayone.gif?raw=true",
    number: 1,
    day: "monday",
    title: "day 1 - HIIT",
    workout: "HIIT",
    instructions: "https://github.com/jpfraneto/images/blob/main/dayoneinstructions.png?raw=true",
    confirmation: "https://github.com/jpfraneto/images/blob/main/dayonehigher.png?raw=true",
    shareText: "I just finished my first day of the higher athletic challenge with @afrochiks.\n\nAre you ready to join us?\n\nHere is the workout of today!"
  },
  "2": {
    gifUrl: "https://github.com/jpfraneto/images/blob/main/dayone.gif?raw=true",
    number: 2,
    day: "tuesday",
    title: "day 2 - STRENGTH TEST",
    workout: "STRENGTH TEST",
    instructions: "https://github.com/jpfraneto/images/blob/main/daytwohigher.png?raw=true",
    confirmation: "https://github.com/jpfraneto/images/blob/main/dayonehigher.png?raw=true",
    shareText: "I just finished my second day of the higher athletic challenge with @afrochicks.\n\nAre you ready to join us?\n\nHere is the workout of today!"
  }
};

higherFrame.frame('/:dayNumber', async (c) => {
  const { dayNumber } = c.req.param();
  const dayInfo = daysInfo[dayNumber];
  if (!dayInfo) {
    // Handle case when dayNumber is not found in daysInfo
    return c.res({
      title: 'Error',
      image: 'https://github.com/jpfraneto/images/blob/main/there-was-an-error.png?raw=true',
      intents: [<Button action="/">Go back</Button>],
    });
  }
  return c.res({
    title: 'higher',
    image: dayInfo.gifUrl,
    intents: [<Button action={`/${dayNumber}/instructions`}>{dayInfo.title}</Button>],
  });
})

async function generateCompletionResponse(c: FrameContext<{ Variables: NeynarVariables; State: VibraState }>, dayInfo: DayInfo, userFid: number) {
  const userHistory = await getUserWorkoutHistory(userFid);

  const qs = {
    text: dayInfo.shareText,
    'embeds[]': [
      `https://afrochicks.xyz/higher/${dayInfo.number}`,
    ],
  };

  const shareQs = queryString.stringify(qs);
  const warpcastRedirectLink = `https://warpcast.com/~/compose?${shareQs}`;

  return c.res({
    title: 'Workout Completed',
    image: (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(to bottom, #8AEA92, #80ADA0)',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
      }}>
        <div style={{
          fontSize: '36px',
          fontWeight: 'bold',
          marginBottom: '32px',
          textAlign: 'center',
          display: 'flex',
        }}>
          Congratulations on completing Day {dayInfo.number}!
        </div>
        <div style={{
          fontSize: '24px',
          marginBottom: '48px',
          textAlign: 'center',
          display: 'flex',

        }}>
          You're making great progress on your fitness journey!
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
        }}>
          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
            let backgroundColor = '#D1D5DB'; // Future day (gray)
            if (userHistory.completedDays.includes(day)) {
              backgroundColor = '#10B981'; // Completed day (green)
            } else if (day < dayInfo.number) {
              backgroundColor = '#EF4444'; // Missed day (red)
            }
            return (
              <div
                key={day}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '2rem',
                }}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
    ),
    intents: [
      <Button.Link href={warpcastRedirectLink}>Share</Button.Link>,
      <Button.Link href='https://warpcast.com/afrochicks'>Follow Naomi</Button.Link>,
    ],
  });
}

higherFrame.frame('/:dayNumber/instructions', async (c) => {
  const { dayNumber } = c.req.param();
  const dayInfo = daysInfo[dayNumber];
  const userFid = c.frameData?.fid;
  if (userFid) {
    await getOrCreateUser(Number(userFid));
    
    // Check if the user has already completed the workout for today
    const hasCompletedToday = await hasUserCompletedWorkoutToday(Number(userFid), dayInfo.number);
    
    if (hasCompletedToday) {
      return generateCompletionResponse(c, dayInfo, userFid);
    }
  }
  
  return c.res({
    title: 'higher',
    image: dayInfo.instructions ,
    intents: [
    <Button action={`/${dayNumber}`}>Back to Video</Button>,
      <Button action={`/${dayNumber}/completed`}>Mark Complete</Button>
    ],
  });
})


higherFrame.frame('/:dayNumber/completed', async (c) => {
  const { dayNumber } = c.req.param();
  const userFid = c.frameData?.fid
  const dayInfo = daysInfo[dayNumber];
  return c.res({
    title: 'higher',
    image: dayInfo.confirmation ,
    intents: [
      <Button action={`/${dayNumber}/instructions`}>Back</Button>,
      <Button action={`/${dayNumber}/confirm`}>Confirm</Button>
    ],
  });
})

higherFrame.frame('/:dayNumber/confirm', async (c) => {
  const { dayNumber } = c.req.param();
  const userFid = c.frameData?.fid;
  const dayInfo = daysInfo[dayNumber];

  if (userFid) {
    const fid = Number(userFid);
    await getOrCreateUser(fid);
    await updateUserWorkout(fid, dayInfo.number);
    return generateCompletionResponse(c, dayInfo, fid);
  }

  return c.res({
    title: 'Error',
    image: 'https://github.com/jpfraneto/images/blob/main/there-was-an-error.png?raw=true',
    intents: [<Button action="/">Go Back</Button>],
  });
})