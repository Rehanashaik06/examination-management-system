(() => {
  const $ = (id) => document.getElementById(id);
  let activeExam = null;
  const notice = (message, kind = 'success') => {
    $('notice').replaceChildren();
    const el = document.createElement('div'); el.className = `alert alert-${kind}`; el.textContent = message; $('notice').append(el);
  };
  async function api(path, options = {}) {
    const response = await fetch(`/api/admin${path}`, { credentials: 'same-origin', ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
    let data = {}; try { data = await response.json(); } catch (_) {}
    if (response.status === 401 || response.status === 403) { notice(response.status === 401 ? 'Please sign in to an administrator account.' : 'This account does not have administrator access.', 'warning'); throw new Error('Access denied'); }
    if (!response.ok) throw new Error(data.error?.message || 'The request failed.');
    return data;
  }
  const cell = (row, value) => { const td = document.createElement('td'); td.textContent = value == null ? '' : String(value); row.append(td); return td; };
  const empty = (tbody, cols, message) => { const tr = document.createElement('tr'); const td = document.createElement('td'); td.colSpan = cols; td.textContent = message; tr.append(td); tbody.replaceChildren(tr); };
  async function load() {
    try {
      const [dash, examData, report] = await Promise.all([api('/dashboard'), api('/exams'), api('/results')]);
      const s = dash.summary; $('summary').replaceChildren();
      [['Total exams',s.total_exams],['Published',s.published_exams],['Students',s.total_students],['Submitted attempts',s.submitted_attempts]].forEach(([label,value]) => { const col=document.createElement('div'); col.className='col-6 col-lg-3'; const card=document.createElement('div'); card.className='card summary-card'; const body=document.createElement('div'); body.className='card-body'; const h=document.createElement('div'); h.className='h3 mb-1'; h.textContent=value; const p=document.createElement('div'); p.className='text-muted'; p.textContent=label; body.append(h,p); card.append(body); col.append(card); $('summary').append(col); });
      renderExams(examData.exams); renderResults(report.results);
      if (activeExam) await loadQuestions(activeExam);
    } catch (e) { if (e.message !== 'Access denied') notice(e.message, 'danger'); }
  }
  function renderExams(exams) {
    const body=$('exams'); body.replaceChildren(); if (!exams.length) return empty(body,5,'No exams yet. Create one to get started.');
    exams.forEach(exam => { const tr=document.createElement('tr'); cell(tr,exam.title); cell(tr,`${exam.duration_minutes} min`); cell(tr,exam.is_published ? 'Yes' : 'No'); cell(tr,exam.question_count); const actions=cell(tr,''); const edit=document.createElement('button'); edit.className='btn btn-sm btn-outline-primary me-2'; edit.textContent='Edit'; edit.onclick=()=>fillExam(exam); const manage=document.createElement('button'); manage.className='btn btn-sm btn-outline-secondary'; manage.textContent='Manage questions'; manage.onclick=()=>{activeExam=exam.id;$('selected-title').textContent=`— ${exam.title}`;loadQuestions(exam.id);}; actions.append(edit,manage); body.append(tr); });
  }
  function renderResults(items) { const body=$('results'); body.replaceChildren(); if (!items.length) return empty(body,5,'No submitted or expired attempts yet.'); items.forEach(x=>{const tr=document.createElement('tr');cell(tr,x.student_name);cell(tr,x.exam_title);cell(tr,`${x.score} / ${x.total_marks}`);cell(tr,x.status);cell(tr,x.submitted_at || '—');body.append(tr);}); }
  async function loadQuestions(examId) {
    try { const data=await api(`/exams/${examId}/questions`); const body=$('questions');body.replaceChildren();if(!data.questions.length)return empty(body,4,'No questions for this exam yet.');data.questions.forEach(q=>{const tr=document.createElement('tr');cell(tr,q.question_text);cell(tr,q.correct_option);cell(tr,q.marks);const actions=cell(tr,'');const edit=document.createElement('button');edit.className='btn btn-sm btn-outline-primary me-2';edit.textContent='Edit';edit.onclick=()=>fillQuestion(q);const del=document.createElement('button');del.className='btn btn-sm btn-outline-danger';del.textContent='Delete';del.onclick=async()=>{if(!confirm('Delete this question?'))return;try{await api(`/questions/${q.id}`,{method:'DELETE'});notice('Question deleted.');await loadQuestions(examId);await load();}catch(e){notice(e.message,'danger');}};actions.append(edit,del);body.append(tr);}); } catch(e){notice(e.message,'danger');}
  }
  function fillExam(x){$('exam-id').value=x.id;$('exam-title').value=x.title;$('exam-description').value=x.description||'';$('exam-duration').value=x.duration_minutes;$('exam-published').checked=!!x.is_published;}
  function resetExam(){$('exam-form').reset();$('exam-id').value='';}
  function fillQuestion(q){$('question-id').value=q.id;$('question-text').value=q.question_text;['a','b','c','d'].forEach(k=>$(`option-${k}`).value=q[`option_${k}`]);$('correct-option').value=q.correct_option;$('marks').value=q.marks;}
  function resetQuestion(){$('question-form').reset();$('question-id').value='';$('marks').value=1;}
  $('exam-form').onsubmit=async e=>{e.preventDefault();const id=$('exam-id').value;const payload={title:$('exam-title').value,description:$('exam-description').value,duration_minutes:Number($('exam-duration').value),is_published:$('exam-published').checked};try{await api(id?`/exams/${id}`:'/exams',{method:id?'PUT':'POST',body:JSON.stringify(payload)});notice('Exam saved.');resetExam();await load();}catch(err){notice(err.message,'danger');}};
  $('question-form').onsubmit=async e=>{e.preventDefault();if(!activeExam){notice('Select an exam first.','warning');return;}const id=$('question-id').value;const payload={question_text:$('question-text').value,option_a:$('option-a').value,option_b:$('option-b').value,option_c:$('option-c').value,option_d:$('option-d').value,correct_option:$('correct-option').value,marks:Number($('marks').value)};try{await api(id?`/questions/${id}`:`/exams/${activeExam}/questions`,{method:id?'PUT':'POST',body:JSON.stringify(payload)});notice('Question saved.');resetQuestion();await loadQuestions(activeExam);await load();}catch(err){notice(err.message,'danger');}};
  $('new-exam').onclick=resetExam;$('cancel-exam').onclick=resetExam;$('cancel-question').onclick=resetQuestion;
  $('logout').onclick=async()=>{try{const r=await fetch('/logout',{method:'POST',credentials:'same-origin'});if(r.ok)location.assign('/login');else notice('Could not log out.','danger');}catch(_){notice('Could not log out.','danger');}};
  load();
})();
