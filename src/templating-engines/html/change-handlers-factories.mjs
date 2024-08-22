import {ObservedArray} from "../../observed-array.mjs";

const SELF_BUILD = Symbol.for("__self_build__");

/**
 *
 * @param element
 * @param attributeName
 * @returns {function(*): void}
 */
export const createAttrChangeHandler = (element, attributeName) => (event) => {
    // this one has to be treated in a special way.
    if (event.eventTarget) element.setAttribute(attributeName, event.eventTarget);
    else element.setAttribute(attributeName, event.value);
};

/**
 *
 * @param {HTMLElement} element
 * @param {string} attributeName
 * @param {boolean} withConditional
 * @returns {function(*): (undefined)}
 */
export const createBoolAttributeChangeHandler = (element, attributeName, withConditional = true) => {
    element.removeAttribute(attributeName);
    return (event) => {
        let actualValue = null;
        if (withConditional) {
            actualValue = event.eventTarget.conditionResults;
        } else {
            actualValue = typeof event?.value?.getValue === "function" ? event.value.getValue() : event.value;
        }
        const value = !!(actualValue === true || actualValue === "true" || actualValue === attributeName || actualValue === "on");
        element[attributeName] = value
        if(value) element.setAttribute(attributeName, value);
        else element.removeAttribute(attributeName);
    };
};

const idlAttributes = {
    value: {
        type: null,
        idlName: "value",
    },
    max: {
        type: Number,
        idlName: "max"
    },
    min: {
        type: Number,
        idlName: "min"
    },
    minlength: {
        type: Number,
        idlName: "minLength"
    },
    maxlength: {
        type: Number,
        idlName: "maxLength"
    }
    // TODO Complete the list.
};

/**
 *
 * @param {string} attributeName
 * @returns {boolean}
 */
export const isIdlAttribute = (attributeName) => !!(idlAttributes[attributeName] || attributeName.startsWith("aria"));

/**
 *
 * @param {string} attributeName
 * @returns {string|false}
 */
export const getIDLforAttribute = (attributeName) => idlAttributes[attributeName]?.idlName || (
        (attributeName.startsWith("aria") && attributeName.replace(/\-[a-z]/ig, (i) => i[1].toUpperCase()))
);

export const createIDLChangeHandler = (element, idlAttributeName, withConditional) => (event) => {
    const idlName = getIDLforAttribute(idlAttributeName);
    let actualValue = null;
    if (withConditional) {
        actualValue = event.eventTarget.conditionResults;
    } else {
        if (element.isObservedComponent) {
            if (element.attrs[idlAttributeName] !== event.value) {
                element.attrs[idlAttributeName] = event.value;
                return;
            }
        } else
            actualValue = typeof event?.value?.getValue === "function" ? event.value.getValue() : event.value;
    }
    element[idlName] = actualValue;
};

/**
 *
 * @param {HTMLElement | Text | *} element
 * @returns {NodeChangeHandler} the change Handler function for the element.
 */
export const createNodeChangeHandler = (element) => {
    const f = function (event) {
        if (event.eventTarget instanceof ObservedArray) {
            // this is an array
            switch (event.eventTarget[SELF_BUILD].builtWith) {
                case "constructor":
                    element.data = event.eventTarget;
                    break;
                case "map":
                    // this usually is a container;
                    if (event.eventTarget[SELF_BUILD].container) {
                        event.eventTarget[SELF_BUILD].container.textContent = "";
                        event.eventTarget[SELF_BUILD].container.append(...event.eventTarget);
                    } else {
                        element.data = Array.from(event.eventTarget).join("");
                    }

                    break;
            }
        } else {
            element.data = event.value;
        }
    };

    return f;
};
