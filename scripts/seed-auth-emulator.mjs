// Auth 에뮬레이터에 로그인 계정을 만든다 (npm run emulators 실행 중에 npm run seed:auth)
// 실제 Firebase 프로젝트에는 쓰지 않는다.
// - 태링: .env.local 의 VITE_OWNER_EMAIL
// - 버미: 에뮬레이터 전용 테스트 계정 beomi@kdoma.test (각자 1인 가구 확인용, KD-58)
// 에뮬레이터 전용 테스트 비밀번호 (Firebase 는 6자 이상만 허용): kdoma1234
const HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9099';
const PROJECT_ID = 'k-doma';
const TEST_PASSWORD = 'kdoma1234';
const ownerEmail = process.env.VITE_OWNER_EMAIL?.trim();

if (!ownerEmail) {
  console.error('.env.local 에 VITE_OWNER_EMAIL 이 없어요');
  process.exit(1);
}

const accounts = [
  { email: ownerEmail, displayName: '태링' },
  { email: 'beomi@kdoma.test', displayName: '버미' },
];

for (const { email, displayName } of accounts) {
  const res = await fetch(`http://${HOST}/identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
    body: JSON.stringify({ email, password: TEST_PASSWORD, displayName }),
  });
  const body = await res.json();
  if (res.ok) console.log(`created ${email}`);
  else if (body.error?.message?.includes('EMAIL_EXISTS')) console.log(`exists  ${email}`);
  else {
    console.error(`failed  ${email}`, body.error?.message ?? body);
    process.exitCode = 1;
  }
}
