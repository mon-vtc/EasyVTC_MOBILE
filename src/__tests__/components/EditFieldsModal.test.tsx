// __TEST__/components/EditFieldsModal.test.tsx
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import EditFieldsModal, { type EditableField } from '../../components/common/EditFieldsModal';

const FIELDS: EditableField[] = [
  { key: 'siret', label: 'SIRET', value: '', validate: v => /^\d{14}$/.test(v) ? null : 'Le SIRET doit contenir exactement 14 chiffres' },
  { key: 'company_name', label: 'Nom de la société', value: 'Dupont VTC' },
];

// Icônes : évite le chargement asynchrone des polices (avertissements act)
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

function setup() {
  const onConfirm = jest.fn();
  render(
    <EditFieldsModal visible title="Identité de facturation" fields={FIELDS} onConfirm={onConfirm} onClose={jest.fn()} />,
  );
  return { onConfirm };
}

describe('EditFieldsModal', () => {
  it('bloque l\'enregistrement tant que rien n\'a changé', () => {
    const { onConfirm } = setup();

    fireEvent.press(screen.getByText('Enregistrer'));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('affiche l\'erreur de validation et bloque un SIRET invalide', () => {
    const { onConfirm } = setup();

    fireEvent.changeText(screen.getAllByDisplayValue('')[0], '1234');
    expect(screen.getByText('Le SIRET doit contenir exactement 14 chiffres')).toBeTruthy();

    fireEvent.press(screen.getByText('Enregistrer'));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('n\'envoie que les champs modifiés, valeurs nettoyées', () => {
    const { onConfirm } = setup();

    fireEvent.changeText(screen.getAllByDisplayValue('')[0], ' 12345678900011 ');
    fireEvent.press(screen.getByText('Enregistrer'));

    expect(onConfirm).toHaveBeenCalledWith({ siret: '12345678900011' });
  });
});
