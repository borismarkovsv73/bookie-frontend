import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterComponent } from './register.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { AuthenticationService } from '../authentication.service';
import { SharedService } from '../../shared/shared.service';
import { MaterialModule } from '../../infrastructure/material/material.module';
import { SharedModule } from '../../shared/shared.module';
import { NewUser } from './model/new-user.model';

describe('RegisterComponent', (): void => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authenticationServiceSpy: jasmine.SpyObj<AuthenticationService>;
  let sharedServiceSpy: jasmine.SpyObj<SharedService>;
  let router: Router;

  const validValues = {
    email: 'test.user@example.com',
    password: 'Password123',
    confirmPassword: 'Password123',
    name: 'John',
    surname: 'Doe',
    address: '123 Main Street',
    telephone: '0611234567',
    role: 'Guest',
  };

  const mockRegisteredUser: NewUser = {
    username: validValues.email,
    password: validValues.password,
    name: validValues.name,
    surname: validValues.surname,
    addressOfResidence: validValues.address,
    telephone: validValues.telephone,
    role: validValues.role,
  };

  beforeEach(async (): Promise<void> => {
    authenticationServiceSpy = jasmine.createSpyObj<AuthenticationService>(
      AuthenticationService.name,
      ['register']
    );
    sharedServiceSpy = jasmine.createSpyObj<SharedService>(SharedService.name, ['openSnackBar']);

    await TestBed.configureTestingModule({
      declarations: [RegisterComponent],
      imports: [
        HttpClientTestingModule,
        MaterialModule,
        SharedModule,
        FormsModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        RouterTestingModule,
      ],
      providers: [
        { provide: AuthenticationService, useValue: authenticationServiceSpy },
        { provide: SharedService, useValue: sharedServiceSpy },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function fillFormWithValidValues(): void {
    component.registerForm.setValue(validValues);
  }

  function getSubmitButton(): HTMLButtonElement {
    return fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
  }

  // --- 1. Component creation (smoke test) ---------------------------------

  it('should create', (): void => {
    expect(component).toBeTruthy();
  });

  // --- 2. Negative: empty form is invalid ---------------------------------

  it('should have an invalid form and a disabled submit button when all fields are empty', (): void => {
    fixture.detectChanges();

    expect(component.registerForm.invalid).toBeTrue();
    expect(getSubmitButton().disabled).toBeTrue();
  });

  // --- 3. Positive: fully and correctly filled form is valid --------------

  it('should have a valid form and an enabled submit button when all fields are correctly filled in', (): void => {
    fillFormWithValidValues();
    fixture.detectChanges();

    expect(component.registerForm.valid).toBeTrue();
    expect(getSubmitButton().disabled).toBeFalse();
  });

  // --- 4. Negative: each required field individually ----------------------

  (Object.keys(validValues) as (keyof typeof validValues)[]).forEach((controlName): void => {
    it(`should be invalid when "${controlName}" is left empty while every other field is valid`, (): void => {
      fillFormWithValidValues();
      component.registerForm.get(controlName)?.setValue('');
      fixture.detectChanges();

      expect(component.registerForm.invalid).toBeTrue();
      expect(getSubmitButton().disabled).toBeTrue();
    });
  });

  // --- 5. Negative: mismatched passwords -----------------------------------

  it(
    'should flag a passwordMismatch error on the form when password and confirmPassword differ, ' +
      'which is what the template uses to keep the submit button disabled',
    (): void => {
      fillFormWithValidValues();
      component.registerForm.get('confirmPassword')?.setValue('SomethingElse456');
      fixture.detectChanges();

      expect(component.registerForm.hasError('passwordMismatch')).toBeTrue();
      expect(component.registerForm.invalid).toBeTrue();
      expect(getSubmitButton().disabled).toBeTrue();

      const matErrorBeforeTouch = fixture.debugElement.query(By.css('mat-error'));
      expect(matErrorBeforeTouch).toBeNull();

      component.registerForm.get('confirmPassword')?.markAsTouched();
      fixture.detectChanges();
      const matErrorAfterTouch = fixture.debugElement.query(By.css('mat-error'));
      expect(matErrorAfterTouch).toBeNull();
    }
  );

  // --- 6. Boundary: identical non-empty passwords match --------------------

  it('should not flag a passwordMismatch error when password and confirmPassword are identical', (): void => {
    fillFormWithValidValues();
    fixture.detectChanges();

    expect(component.registerForm.hasError('passwordMismatch')).toBeFalse();
  });

  // --- 7. Positive: correct data mapping is sent to the backend ------------

  it(
    'should send the entered data to AuthenticationService.register with the fields correctly mapped ' +
      '(email -> username, address -> addressOfResidence)',
    (): void => {
      authenticationServiceSpy.register.and.returnValue(of(mockRegisteredUser));
      fillFormWithValidValues();
      fixture.detectChanges();

      component.onSubmit();

      expect(authenticationServiceSpy.register).toHaveBeenCalledTimes(1);
      expect(authenticationServiceSpy.register).toHaveBeenCalledWith({
        username: validValues.email,
        password: validValues.password,
        name: validValues.name,
        surname: validValues.surname,
        addressOfResidence: validValues.address,
        telephone: validValues.telephone,
        role: validValues.role,
      });
    }
  );

  // --- 8. Positive: successful submission navigates to /login --------------

  it('should navigate to /login after a successful registration', (): void => {
    authenticationServiceSpy.register.and.returnValue(of(mockRegisteredUser));
    fillFormWithValidValues();
    fixture.detectChanges();

    component.onSubmit();

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  // --- 9. Negative: backend error message is surfaced via the snackbar -----

  it('should show the backend error message via the snackbar when registration fails', (): void => {
    authenticationServiceSpy.register.and.returnValue(
      throwError(() => ({ error: { message: 'Email already exists.' } }))
    );
    fillFormWithValidValues();
    fixture.detectChanges();

    component.onSubmit();

    expect(sharedServiceSpy.openSnackBar).toHaveBeenCalledWith('Email already exists.');
  });

  // --- 10. Boundary: no backend message -> fallback message ----------------

  it('should show a generic fallback message via the snackbar when registration fails without a backend message', (): void => {
    authenticationServiceSpy.register.and.returnValue(throwError(() => ({ error: {} })));
    fillFormWithValidValues();
    fixture.detectChanges();

    component.onSubmit();

    expect(sharedServiceSpy.openSnackBar).toHaveBeenCalledWith('Error reaching the server.');
  });

  // --- 11. Submit button reflects form validity -----------------------------

  it('should toggle the submit button disabled state as the form goes from invalid to valid', (): void => {
    fixture.detectChanges();
    expect(getSubmitButton().disabled).toBeTrue();

    fillFormWithValidValues();
    fixture.detectChanges();
    expect(getSubmitButton().disabled).toBeFalse();
  });
});
