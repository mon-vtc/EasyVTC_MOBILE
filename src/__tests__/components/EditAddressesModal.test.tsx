// __TEST__/components/EditAddressesModal.test.tsx
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import EditAddressesModal from '../../components/common/EditAddressesModal';

// Suggestions déterministes : renvoyées dès que le champ a le focus et 3+ caractères
const SUGGESTION = { label: '10 avenue de la Défense, Puteaux', latitude: 48.892, longitude: 2.236 };
jest.mock('../../hooks/useAddressSearch', () => ({
  useAddressSearch: (query: string, active: boolean) => ({
    suggestions: active && query.trim().length >= 3 ? [SUGGESTION] : [],
    isSearching: false,
  }),
}));

const PICKUP = '1 rue de la Paix, Paris';
const DEST   = 'Aéroport CDG, Roissy';

// Icônes : évite le chargement asynchrone des polices (avertissements act)
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

function setup(extra: Partial<React.ComponentProps<typeof EditAddressesModal>> = {}) {
  const onConfirm = jest.fn();
  const onClose   = jest.fn();
  render(
    <EditAddressesModal
      visible
      pickupAddress={PICKUP}
      destAddress={DEST}
      onConfirm={onConfirm}
      onClose={onClose}
      {...extra}
    />,
  );
  return { onConfirm, onClose };
}

describe('EditAddressesModal', () => {
  it('pré-remplit les adresses actuelles et bloque l\'enregistrement sans changement', () => {
    const { onConfirm } = setup();

    expect(screen.getByDisplayValue(PICKUP)).toBeTruthy();
    expect(screen.getByDisplayValue(DEST)).toBeTruthy();

    fireEvent.press(screen.getByText('Enregistrer'));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('envoie la destination choisie dans les suggestions avec ses coordonnées', () => {
    const { onConfirm } = setup();
    const destInput = screen.getByDisplayValue(DEST);

    fireEvent(destInput, 'focus');
    fireEvent.changeText(destInput, '10 avenue de la Def');
    fireEvent.press(screen.getByText(SUGGESTION.label));
    fireEvent.press(screen.getByText('Enregistrer'));

    expect(onConfirm).toHaveBeenCalledWith({
      dest_address: SUGGESTION.label,
      dest_lat:     SUGGESTION.latitude,
      dest_lng:     SUGGESTION.longitude,
    });
  });

  it('refuse une adresse tapée sans être choisie dans la liste', () => {
    const { onConfirm } = setup();
    const destInput = screen.getByDisplayValue(DEST);

    fireEvent(destInput, 'focus');
    fireEvent.changeText(destInput, 'Une adresse saisie à la main');
    fireEvent(destInput, 'blur');
    fireEvent.press(screen.getByText('Enregistrer'));

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('verrouille le départ une fois le passager à bord', () => {
    setup({ pickupLocked: true });

    expect(screen.getByDisplayValue(PICKUP).props.editable).toBe(false);
    expect(screen.getByText(/seul l'arrivée peut changer/)).toBeTruthy();
  });

  it('ferme la modale via Retour', () => {
    const { onClose } = setup();

    fireEvent.press(screen.getByText('Retour'));
    expect(onClose).toHaveBeenCalled();
  });
});
