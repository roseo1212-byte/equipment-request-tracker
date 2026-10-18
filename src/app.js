import {
  RequestValidationError,
  appendRequest,
  createRequest,
  loadRequests,
  saveRequests,
  localDate, isOverdue, requestStatus, selectRequests, validateFilters, resolveRequest,
} from "./request-store.js";

const form = document.querySelector("#request-form");
const message = document.querySelector("#form-message");
const neededByInput = document.querySelector("#needed-by");
const count = document.querySelector("#request-count");
const emptyState = document.querySelector("#empty-state");
const tableWrapper = document.querySelector("#request-table-wrapper");
const tableBody = document.querySelector("#request-table-body");

const filtersForm = document.querySelector('#request-filters');
const viewButtons = [
  [document.querySelector("#show-new-request"), document.querySelector("#new-request-view")],
  [document.querySelector("#show-workload"), document.querySelector("#workload-view")],
];
for (const [button, panel] of viewButtons) {
  button.addEventListener("click", () => {
    for (const [otherButton, otherPanel] of viewButtons) {
      const selected = otherPanel === panel;
      otherPanel.hidden = !selected;
      otherButton.setAttribute("aria-pressed", String(selected));
    }
  });
}
let requests = loadRequests();
filtersForm.addEventListener('submit', event => event.preventDefault());
filtersForm.addEventListener('input', renderRequests);
filtersForm.addEventListener('change', renderRequests);
filtersForm.addEventListener('reset', (event) => {
  event.preventDefault();
  for (const control of filtersForm.elements) {
    if (control.name) control.value = "";
  }
  renderRequests();
});
window.addEventListener('focus', renderRequests);
// Keep overdue labels current across midnight.
setInterval(renderRequests, 60000);

neededByInput.min = localDate();
renderRequests();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  clearFieldErrors();
  setMessage("");

  const input = Object.fromEntries(new FormData(form).entries());

  try {
    const request = createRequest(input);
    requests = appendRequest(requests, request);
    saveRequests(requests);
    form.reset();
    neededByInput.min = localDate();
    setMessage("Request added.");
    renderRequests();
    document.querySelector("#requester").focus();
  } catch (error) {
    if (error instanceof RequestValidationError) {
      showFieldErrors(error.errors);
      setMessage("Check the highlighted fields.", true);
      return;
    }

    setMessage("The request could not be saved. Try again.", true);
    console.error(error);
  }
});

function renderRequests() {
  const filters = Object.fromEntries(new FormData(filtersForm).entries());
  const error = validateFilters(filters);
  document.querySelector('#filter-message').textContent = error;
  for (const name of ['start', 'end']) filtersForm.elements[name].setAttribute('aria-invalid', String(Boolean(error)));
  const active = requests.filter(request => requestStatus(request) === 'active');
  const visible = selectRequests(requests, filters);
  count.textContent = visible.length + ' of ' + active.length + ' active requests';
  emptyState.hidden = visible.length > 0 || Boolean(error);
  emptyState.querySelector('h3').textContent = active.length ? 'No matching requests.' : 'No active requests.';
  emptyState.querySelector('p').textContent = active.length ? 'Clear filters to show all active requests.' : 'Add an equipment request using the form.';
  tableWrapper.hidden = visible.length === 0;
  tableBody.replaceChildren(...visible.map(request => createRequestRow(request)));
  const history = requests.filter(request => ['fulfilled', 'canceled'].includes(requestStatus(request)));
  document.querySelector('#history-empty').hidden = history.length > 0;
  document.querySelector('#history-table-wrapper').hidden = history.length === 0;
  document.querySelector('#history-table-body').replaceChildren(...history.map(request => createRequestRow(request, true)));
}

function createRequestRow(request, history = false) {
  const row = document.createElement('tr');
  const values = [request.requester, request.department, request.equipment, request.priority,
    formatDate(request.neededBy), request.reason, formatDateTime(request.createdAt)];
  for (const [index, value] of values.entries()) {
    const cell = document.createElement('td');
    cell.textContent = value;
    if (index === 3) {
      cell.className = request.priority === 'High' ? 'priority-label priority-high' : 'priority-label';
    }
    if (index === 4 && isOverdue(request)) {
      const label = document.createElement('span');
      label.className = 'overdue-label';
      label.textContent = 'Overdue';
      cell.append(label);
    }
    row.append(cell);
  }
  const actions = document.createElement('td');
  if (history) actions.textContent = requestStatus(request) === 'fulfilled' ? 'Fulfilled' : 'Canceled';
  else for (const [status, text] of [['fulfilled', 'Mark fulfilled'], ['canceled', 'Cancel request']]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = text;
    button.setAttribute('aria-label', text + ' for ' + request.requester + ': ' + request.equipment);
    button.addEventListener('click', () => {
      try {
        const updated = resolveRequest(requests, request.id, status);
        saveRequests(updated);
        requests = updated;
        renderRequests();
        document.querySelector('#action-message').textContent = 'Request ' + status + '. Available in history.';
        filtersForm.querySelector('button').focus();
      } catch {
        document.querySelector('#action-message').textContent = 'The request could not be saved. Try again.';
      }
    });
    actions.append(button);
  }
  row.append(actions);
  if (history) {
    const timestamp = document.createElement("td");
    const validTimestamp = request.resolvedAt && !Number.isNaN(new Date(request.resolvedAt).getTime());
    timestamp.textContent = validTimestamp
      ? (requestStatus(request) === "fulfilled" ? "Fulfilled on: " : "Canceled on: ") + formatDateTime(request.resolvedAt)
      : "Date not recorded";
    row.append(timestamp);
  }
  return row;
}

function formatDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function formatDateTime(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function showFieldErrors(errors) {
  const firstInvalidField = Object.keys(errors)[0];

  for (const fieldName of Object.keys(errors)) {
    const element = form.elements[fieldName];
    element?.setAttribute('aria-invalid', 'true');
    if (element) {
      const guidance = document.createElement('p');
      guidance.className = 'field-error';
      guidance.id = element.id + '-error';
      guidance.textContent = errors[fieldName];
      element.setAttribute('aria-describedby', guidance.id);
      element.after(guidance);
    }
  }

  form.elements[firstInvalidField]?.focus();
}

function clearFieldErrors() {
  form.querySelectorAll('.field-error').forEach(element => element.remove());
  for (const element of form.elements) {
    element.removeAttribute?.('aria-describedby');
    element.removeAttribute?.("aria-invalid");
  }
}

function setMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}

