// ⚠️ 중요: 아래 URL을 실제 Google Apps Script URL로 변경하세요!
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx3HyZSbscnaN7suPYZaplt_N5AZyiof7JTZJkYvzT-Y7OUrGT6teixE7sHkOhDJchLhA/exec';

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
            
            // Google Apps Script로 데이터 전송
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
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
    const confirmNumber = document.getElementById('confirmNumber');
    
    // 로딩 숨기기
    loadingDiv.classList.remove('active');
    
    // 폼 숨기기
    form.style.display = 'none';
    
    // 성공 메시지 표시
    confirmNumber.textContent = `접수번호: ${formId}`;
    successMessage.style.display = 'block';
    
    // 알림 메시지
    setTimeout(() => {
        alert(`상담이 접수되었습니다.\n\n접수번호: ${formId}\n\n접수번호를 메모해두시면 처리 상태를 확인하실 수 있습니다.`);
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
