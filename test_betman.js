// test_betman.js
async function runTest() {
  try {
    // 1. IP 확인
    console.log("1. 현재 IP 확인 중...");
    const ipRes = await fetch('https://api.ipify.org?format=json');
    if (ipRes.ok) {
        const ipData = await ipRes.json();
        console.log("   현재 IP:", ipData.ip);
    } else {
        console.log("   IP 확인 실패");
    }

    // 2. 배트맨 접속 시도
    console.log("\n2. 배트맨 서버(betman.co.kr) 접속 시도 중...");
    const response = await fetch('https://www.betman.co.kr', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
      }
    });

    console.log('   Status Code:', response.status);
    if (response.ok) {
        const text = await response.text();
        const titleMatch = text.match(/<title>(.*?)<\/title>/);
        console.log('   Page Title:', titleMatch ? titleMatch[1] : 'No title found');
        console.log('\n✅ 성공적으로 배트맨 메인 페이지에 접속했습니다!');
    } else {
        console.log('\n❌ 상태 코드:', response.status, '- VPN 접속이 불안정하거나 여전히 차단되었습니다.');
    }
  } catch (error) {
    console.error('\n❌ 에러 발생 (방화벽 또는 타임아웃):', error.message);
  }
}

runTest();
