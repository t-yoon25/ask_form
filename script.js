// ⚠️ 중요: 아래 URL을 실제 Google Apps Script URL로 변경하세요!
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxhsnSjHUK4GODCfNwcm3QU3gnMNydBHFxCY1iBgs1m0f2XdEjIeXYn8eOXrW_1RWbT/exec';

// 페이지가 로드되면 실행
document.addEventListener('DOMContentLoaded', function() {
    // 현재 시간 설정
    setCurrentTime();
    
    // 고유 ID 생성
    generateFormId();
    
    // 전화번호 자동 포맷팅
    setupPhoneFormatting();
    
    // 폼 제출 처리
    setupFormSubmit();
});

// 현재 시간을 설정하는 함수
function setCurrentTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    
    const dateStr = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    document.getElementById('createdAt').value = dateStr;
}

// 고유 접수번호를 생성하는 함수
function generateFormId() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000);
    
    const formId = `${year}${month}${day}-${random}`;
    document.getElementById('formId').value = formId;
}

// 전화번호 자동 포맷팅 설정
function setupPhoneFormatting() {
    const phoneInput = document.getElementById('phone');
    
    phoneInput.addEventListener('input', function(e) {
        // 숫자만 남기기
        let value = e.target.value.replace(/[^0-9]/g, '');
        
        // 자동으로 하이픈 추가
        if (value.length >= 10) {
            if (value.length === 10) {
                // 10자리인 경우 (예: 031-123-4567)
                value = value.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
            } else if (value.length === 11) {
                // 11자리인 경우 (예: 010-1234-5678)
                value = value.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
            }
            e.target.value = value;
        }
    });
}

// 폼 제출 처리 설정
function setupFormSubmit() {
    const form = document.getElementById('consultForm');
    const submitBtn = document.getElementById('submitBtn');
    const loadingDiv = document.getElementById('loadingDiv');
    const successMessage = document.getElementById('successMessage');
    
    form.addEventListener('submit', async function(e) {
        // 기본 제출 동작 막기
        e.preventDefault();
        
        // 전화번호 검증
        if (!validatePhone()) {
            return;
        }
        
        // 버튼 비활성화 및 로딩 표시
        submitBtn.disabled = true;
        loadingDiv.classList.add('active');
        
        try {
            // 폼 데이터 수집
            const formData = collectFormData();
            
            // FormData 객체로 변환 (URL 인코딩 방식)
            const postData = new FormData();
            for (const key in formData) {
                postData.append(key, formData[key]);
            }
            
            // Google Apps Script로 데이터 전송
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: postData
            });
            
            // 성공 처리
            handleSuccess(formData.formId);
            
        } catch (error) {
            // 에러 처리
            handleError(error);
        }
    });
}

// 전화번호 유효성 검사
function validatePhone() {
    const phoneInput = document.getElementById('phone');
    const phoneError = document.getElementById('phoneError');
    const phonePattern = /^[0-9]{3}-[0-9]{3,4}-[0-9]{4}$/;
    
    if (!phonePattern.test(phoneInput.value)) {
        phoneError.style.display = 'block';
        phoneInput.focus();
        return false;
    } else {
        phoneError.style.display = 'none';
        return true;
    }
}

// 폼 데이터 수집
function collectFormData() {
    return {
        createdAt: document.getElementById('createdAt').value,
        formId: document.getElementById('formId').value,
        studentName: document.getElementById('studentName').value,
        studentNumber: document.getElementById('studentNumber').value,
        guardianName: document.getElementById('guardianName').value,
        relationship: document.getElementById('relationship').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        topic: document.getElementById('topic').value,
        priority: document.getElementById('priority').value,
        consultType: document.getElementById('consultType').value,
        preferredTime: document.getElementById('preferredTime').value,
        message: document.getElementById('message').value
    };
}

// 성공 처리
function handleSuccess(formId) {
    const form = document.getElementById('consultForm');
    const loadingDiv = document.getElementById('loadingDiv');
    const successMessage = document.getElementById('successMessage');
    
    // 로딩 숨기기
    loadingDiv.classList.remove('active');
    
    // 폼 숨기기
    form.style.display = 'none';
    
    // 성공 메시지에 접수번호 표시
    successMessage.innerHTML = `
        ✅ 상담 신청이 완료되었습니다!<br><br>
        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 10px 0;">
            <strong style="color: #856404; font-size: 18px;">접수번호: ${formId}</strong><br>
            <span style="color: #856404; font-size: 14px;">이 번호를 꼭 메모해주세요!</span>
        </div>
        24시간 이내에 확인 후 답변 드리겠습니다.
    `;
    successMessage.style.display = 'block';
    
    // 알림 메시지
    setTimeout(() => {
        if(confirm(`상담이 접수되었습니다!\n\n📌 접수번호: ${formId}\n\n접수번호를 복사하시겠습니까?`)) {
            // 접수번호를 클립보드에 복사
            navigator.clipboard.writeText(formId).then(() => {
                alert('접수번호가 복사되었습니다.\n메모장 등에 붙여넣기 해두세요.');
            }).catch(() => {
                alert(`접수번호: ${formId}\n\n이 번호를 직접 메모해주세요.`);
            });
        }
    }, 500);
}

// 에러 처리
function handleError(error) {
    const submitBtn = document.getElementById('submitBtn');
    const loadingDiv = document.getElementById('loadingDiv');
    
    console.error('Error:', error);
    alert('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    
    // 버튼 다시 활성화
    submitBtn.disabled = false;
    loadingDiv.classList.remove('active');
}
